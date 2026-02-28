<?php
/**
 * BamLead Geo Grid Engine
 * Step A: City grid generation for granular search coverage
 * Step B: Parallel Serper search via curl_multi for maximum speed
 * 
 * Generates 50-150 location-specific queries per city and fires them
 * ALL simultaneously using curl_multi for enterprise-grade throughput.
 */

/**
 * Step B: Parallel Serper search engine using curl_multi
 * Fires up to $concurrency queries simultaneously
 * 
 * @param array $queries Array of query strings or payload arrays
 * @param string $type 'places', 'maps', or 'search' (organic)
 * @param int $concurrency Max simultaneous connections (default 30)
 * @return array Array of result arrays (one per query)
 */
function parallelSerperSearch(array $queries, string $type = 'places', int $concurrency = 30, int $page = 1): array {
    if (empty($queries) || !defined('SERPER_API_KEY') || empty(SERPER_API_KEY)) {
        return [];
    }

    $endpoint = match($type) {
        'places' => 'https://google.serper.dev/places',
        'maps'   => 'https://google.serper.dev/maps',
        default  => 'https://google.serper.dev/search',
    };

    $resultKey = match($type) {
        'places', 'maps' => 'places',
        default          => 'organic',
    };

    $allResults = [];
    $batches = array_chunk($queries, $concurrency);

    foreach ($batches as $batchIndex => $batch) {
        $mh = curl_multi_init();

        // Maximize parallel connections
        if (function_exists('curl_multi_setopt')) {
            @curl_multi_setopt($mh, CURLMOPT_MAXCONNECTS, $concurrency);
            if (defined('CURLMOPT_MAX_TOTAL_CONNECTIONS')) {
                @curl_multi_setopt($mh, CURLMOPT_MAX_TOTAL_CONNECTIONS, $concurrency);
            }
        }

        $handles = [];
        foreach ($batch as $i => $query) {
            $payload = is_array($query)
                ? $query
                : ['q' => $query, 'gl' => 'us', 'hl' => 'en'];

            // Add pagination support
            if ($page > 1) {
                $payload['page'] = (int)$page;
            }

            $ch = curl_init($endpoint);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_HTTPHEADER     => [
                    'X-API-KEY: ' . SERPER_API_KEY,
                    'Content-Type: application/json',
                    'Accept: application/json',
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 20,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
                CURLOPT_ENCODING       => '', // accept compressed
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            // HTTP/2 multiplexing for speed
            if (defined('CURL_HTTP_VERSION_2_0')) {
                curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_2_0);
            }
            if (defined('CURLOPT_TCP_FASTOPEN')) {
                curl_setopt($ch, CURLOPT_TCP_FASTOPEN, 1);
            }

            curl_multi_add_handle($mh, $ch);
            $handles[] = $ch;
        }

        // Execute ALL queries simultaneously
        do {
            $status = curl_multi_exec($mh, $running);
            if ($running) {
                curl_multi_select($mh, 0.05);
            }
        } while ($running > 0 && $status === CURLM_OK);

        // Collect results — retry failed/rate-limited queries sequentially
        $failedQueries = [];
        foreach ($handles as $idx => $ch) {
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $items = [];

            if ($httpCode === 200) {
                $body = curl_multi_getcontent($ch);
                $data = json_decode($body, true);
                if (is_array($data)) {
                    $items = $data[$resultKey] ?? [];
                }
            } elseif ($httpCode === 429 || $httpCode === 0 || $httpCode >= 500) {
                // Rate limited (429), connection failed (0), or server error (500+) — queue for retry
                $failedQueries[$idx] = $batch[$idx];
            }

            $allResults[] = $items;
            curl_multi_remove_handle($mh, $ch);
            curl_close($ch);
        }

        curl_multi_close($mh);

        // Sequential retry for failed/rate-limited queries with exponential backoff
        if (!empty($failedQueries)) {
            $retryDelay = 300000; // Start at 300ms for rate-limited queries
            foreach ($failedQueries as $idx => $query) {
                usleep($retryDelay);
                $retryDelay = min($retryDelay + 200000, 1000000); // Increase up to 1s

                $payload = is_array($query)
                    ? $query
                    : ['q' => $query, 'gl' => 'us', 'hl' => 'en'];
                if ($page > 1) $payload['page'] = (int)$page;

                $ch = curl_init($endpoint);
                curl_setopt_array($ch, [
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => json_encode($payload),
                    CURLOPT_HTTPHEADER => [
                        'X-API-KEY: ' . SERPER_API_KEY,
                        'Content-Type: application/json',
                    ],
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => 20,
                    CURLOPT_CONNECTTIMEOUT => 8,
                    CURLOPT_SSL_VERIFYPEER => true,
                ]);
                $response = curl_exec($ch);
                $retryCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($retryCode === 200 && $response) {
                    $data = json_decode($response, true);
                    if (is_array($data)) {
                        $allResults[$idx] = $data[$resultKey] ?? [];
                    }
                } elseif ($retryCode === 429) {
                    // Still rate limited — wait longer and retry once more
                    usleep(1500000); // 1.5s backoff
                    $ch = curl_init($endpoint);
                    curl_setopt_array($ch, [
                        CURLOPT_POST => true,
                        CURLOPT_POSTFIELDS => json_encode($payload),
                        CURLOPT_HTTPHEADER => [
                            'X-API-KEY: ' . SERPER_API_KEY,
                            'Content-Type: application/json',
                        ],
                        CURLOPT_RETURNTRANSFER => true,
                        CURLOPT_TIMEOUT => 20,
                        CURLOPT_CONNECTTIMEOUT => 8,
                        CURLOPT_SSL_VERIFYPEER => true,
                    ]);
                    $response = curl_exec($ch);
                    $retryCode2 = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    if ($retryCode2 === 200 && $response) {
                        $data = json_decode($response, true);
                        if (is_array($data)) {
                            $allResults[$idx] = $data[$resultKey] ?? [];
                        }
                    }
                }
            }
        }

        // ⚡ Pause between batches — prevent Serper rate limiting on shared hosting
        if ($batchIndex < count($batches) - 1) {
            usleep(350000); // 350ms between batches to avoid 429s
        }
    }

    return $allResults;
}

/**
 * Step A: Generate search grid queries for a city
 * Uses neighborhoods, suburbs, directional shards, and distance rings
 * for maximum geographic coverage.
 *
 * @param string $service The business type to search
 * @param string $location Full location string (e.g. "Houston, TX")
 * @param int $targetCount Target number of leads
 * @return array Array of search query strings
 */
function generateSearchGrid(string $service, string $location, int $targetCount = 2000): array {
    $location = trim($location);
    if (empty($location) || empty($service)) return [];

    // Parse city and state
    $city = $location;
    $state = '';
    if (strpos($location, ',') !== false) {
        [$city, $state] = array_map('trim', explode(',', $location, 2));
    } else {
        $cityLower = strtolower(trim($city));
        $stateMap = getGridCityStateMap();
        $state = $stateMap[$cityLower] ?? '';
    }

    $queries = [];
    $seen = [];

    $addQuery = function ($q) use (&$queries, &$seen) {
        $q = preg_replace('/\s+/', ' ', trim($q));
        $key = strtolower($q);
        if (!isset($seen[$key]) && $q !== '') {
            $seen[$key] = true;
            $queries[] = $q;
        }
    };

    $stateSuffix = $state ? ", $state" : "";

    // 1. Metro sub-areas (neighborhoods + suburbs) — highest value
    $subAreas = getMetroSubAreas(strtolower(trim($city)));
    foreach ($subAreas as $area) {
        $addQuery("$service in $area$stateSuffix");
        $addQuery("$service near $area$stateSuffix");
    }

    // 2. Directional grid — covers gaps between neighborhoods
    $directions = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
    foreach ($directions as $dir) {
        $addQuery("$service in $dir $city$stateSuffix");
        $addQuery("$service $dir $city$stateSuffix");
    }

    // 3. Distance-based rings — extends coverage outward
    $distances = ['5 miles from', '10 miles from', '15 miles from', '20 miles from', '25 miles from', '30 miles from'];
    foreach ($distances as $dist) {
        $addQuery("$service $dist $city$stateSuffix");
    }

    // 4. Area descriptors
    $descriptors = ['downtown', 'uptown', 'midtown', 'suburbs of', 'metro', 'greater'];
    foreach ($descriptors as $desc) {
        $addQuery("$service in $desc $city$stateSuffix");
    }

    // 5. Intent modifiers for broader coverage
    $intents = ['best', 'top rated', 'affordable', 'local', 'licensed', 'professional', 'emergency', 'trusted'];
    foreach ($intents as $intent) {
        $addQuery("$intent $service in $city$stateSuffix");
    }

    // 6. Business type suffixes
    $suffixes = ['companies', 'businesses', 'services', 'contractors', 'providers', 'specialists'];
    foreach ($suffixes as $suffix) {
        $addQuery("$service $suffix in $city$stateSuffix");
    }

    // 7. For high-volume, add synonym variants per sub-area
    if ($targetCount >= 1000 && !empty($subAreas)) {
        $synonyms = getGridServiceSynonyms($service);
        $topSynonyms = array_slice($synonyms, 0, min(4, count($synonyms)));
        $topAreas = array_slice($subAreas, 0, min(15, count($subAreas)));
        foreach ($topSynonyms as $syn) {
            foreach ($topAreas as $area) {
                $addQuery("$syn in $area$stateSuffix");
            }
        }
    }

    // 8. County and region queries
    if ($state) {
        $addQuery("$service in $city County, $state");
        $addQuery("$service in $state");
        $addQuery("best $service in $city, $state");
        $addQuery("$service companies in $city, $state");
        $addQuery("$service businesses near $city, $state");
    }

    // Limit queries: each Places query returns ~20 results, ~30% dedup
    // So ~14 unique leads per query → for 2000 leads need ~145 queries
    $maxQueries = (int) ceil($targetCount / 12);
    $maxQueries = max(50, min($maxQueries, 250));

    return array_slice($queries, 0, $maxQueries);
}

/**
 * Get service synonyms for broader grid coverage
 */
function getGridServiceSynonyms(string $service): array {
    $service = strtolower(trim($service));

    $synonymMap = [
        'mechanic'    => ['auto repair', 'car repair', 'auto shop', 'automotive repair', 'car mechanic', 'auto service'],
        'mechanics'   => ['auto repair', 'car repair', 'auto shop', 'automotive repair', 'car mechanic', 'auto service'],
        'plumber'     => ['plumbing', 'plumbing service', 'drain cleaning', 'pipe repair', 'plumbing contractor'],
        'plumbing'    => ['plumber', 'plumbing service', 'drain cleaning', 'pipe repair'],
        'electrician' => ['electrical contractor', 'electrical service', 'electrical repair', 'wiring service'],
        'dentist'     => ['dental office', 'dental clinic', 'dental care', 'dentistry', 'dental practice'],
        'lawyer'      => ['attorney', 'law firm', 'legal services', 'law office'],
        'attorney'    => ['lawyer', 'law firm', 'legal services', 'law office'],
        'restaurant'  => ['dining', 'eatery', 'food', 'cafe', 'bistro'],
        'roofing'     => ['roofer', 'roof repair', 'roofing contractor', 'roof replacement'],
        'roofer'      => ['roofing', 'roof repair', 'roofing contractor', 'roof replacement'],
        'hvac'        => ['air conditioning', 'heating', 'ac repair', 'furnace repair', 'hvac contractor'],
        'landscaping' => ['landscaper', 'lawn care', 'lawn service', 'garden service'],
        'landscaper'  => ['landscaping', 'lawn care', 'lawn service', 'garden service'],
        'cleaning'    => ['cleaning service', 'maid service', 'janitorial', 'house cleaning'],
        'painting'    => ['painter', 'painting contractor', 'house painter'],
        'painter'     => ['painting', 'painting contractor', 'house painter'],
        'moving'      => ['movers', 'moving company', 'moving service', 'relocation'],
        'movers'      => ['moving', 'moving company', 'moving service', 'relocation'],
        'pest control'=> ['exterminator', 'pest management', 'termite control'],
        'real estate' => ['realtor', 'real estate agent', 'property agent', 'real estate broker'],
        'realtor'     => ['real estate', 'real estate agent', 'property agent'],
        'insurance'   => ['insurance agent', 'insurance broker', 'insurance company'],
        'accounting'  => ['accountant', 'cpa', 'bookkeeper', 'tax preparer'],
        'accountant'  => ['accounting', 'cpa', 'bookkeeper', 'tax preparer'],
        'chiropractor'=> ['chiropractic', 'chiropractor office', 'spine doctor'],
        'vet'         => ['veterinarian', 'animal hospital', 'pet clinic', 'veterinary'],
        'veterinarian'=> ['vet', 'animal hospital', 'pet clinic', 'veterinary'],
        'gym'         => ['fitness center', 'fitness gym', 'health club', 'workout'],
        'salon'       => ['hair salon', 'beauty salon', 'barbershop', 'hair stylist'],
        'barbershop'  => ['barber', 'hair salon', 'salon', 'hair cut'],
        'florist'     => ['flower shop', 'floral design', 'flower delivery'],
        'photographer'=> ['photography', 'photo studio', 'photography service'],
        'towing'      => ['tow truck', 'tow service', 'roadside assistance'],
        'locksmith'   => ['lock service', 'locksmith service', 'key service', 'lock repair'],
        'daycare'     => ['child care', 'preschool', 'childcare center'],
        'storage'     => ['self storage', 'storage units', 'mini storage'],
        'auto body'   => ['body shop', 'collision repair', 'auto body shop', 'dent repair'],
        'tire'        => ['tire shop', 'tire service', 'tire dealer', 'tire repair'],
    ];

    // Spa / Wellness
    $synonymMap['spa'] = ['day spa', 'med spa', 'medical spa', 'massage spa', 'wellness spa', 'massage therapy', 'facial spa', 'beauty spa', 'luxury spa', 'spa and wellness'];
    $synonymMap['day spa'] = ['spa', 'med spa', 'massage spa', 'wellness spa', 'relaxation spa', 'beauty spa'];
    $synonymMap['med spa'] = ['medical spa', 'spa', 'medspa', 'aesthetic clinic', 'cosmetic spa', 'Botox provider', 'laser spa'];
    $synonymMap['massage'] = ['massage therapy', 'massage therapist', 'spa', 'deep tissue massage', 'Swedish massage', 'sports massage'];
    $synonymMap['wellness'] = ['wellness spa', 'wellness center', 'holistic wellness', 'spa and wellness', 'health spa'];

    if (isset($synonymMap[$service])) {
        return $synonymMap[$service];
    }

    // AI fallback: dynamically generate synonyms for unknown niches
    $aiSynonyms = generateAISynonyms($service);
    if (!empty($aiSynonyms)) {
        return array_slice($aiSynonyms, 0, 10); // Top 10 for grid
    }

    return [];
}

/**
 * Get metro sub-areas (neighborhoods + suburbs) for major US cities.
 * Each sub-area is a distinct geographic zone that produces unique search results.
 */
function getMetroSubAreas(string $city): array {
    $metros = [
        'houston' => [
            'Midtown Houston', 'The Heights Houston', 'Montrose Houston', 'Galleria Houston',
            'Memorial Houston', 'Spring Branch', 'Clear Lake', 'Cypress TX',
            'Katy TX', 'Sugar Land TX', 'Pearland TX', 'Pasadena TX',
            'Baytown TX', 'The Woodlands TX', 'Humble TX', 'Kingwood Houston',
            'Bellaire TX', 'West University Place TX', 'EaDo Houston',
            'River Oaks Houston', 'Medical Center Houston', 'Energy Corridor Houston',
            'Stafford TX', 'Missouri City TX', 'League City TX',
            'Friendswood TX', 'Spring TX', 'Tomball TX', 'Conroe TX', 'Richmond TX',
        ],
        'dallas' => [
            'Uptown Dallas', 'Deep Ellum Dallas', 'Oak Lawn Dallas', 'Bishop Arts Dallas',
            'Plano TX', 'Frisco TX', 'Arlington TX', 'Irving TX', 'Garland TX',
            'McKinney TX', 'Richardson TX', 'Carrollton TX', 'Lewisville TX',
            'Denton TX', 'Allen TX', 'Mesquite TX', 'Grand Prairie TX',
            'Cedar Hill TX', 'Flower Mound TX', 'Addison TX',
            'Highland Park Dallas', 'Lakewood Dallas', 'Fort Worth TX',
        ],
        'los angeles' => [
            'Hollywood CA', 'Santa Monica CA', 'Beverly Hills CA', 'Pasadena CA',
            'Glendale CA', 'Burbank CA', 'Long Beach CA', 'Torrance CA',
            'Inglewood CA', 'West Hollywood CA', 'Culver City CA',
            'Downtown Los Angeles', 'Echo Park LA', 'Silver Lake LA',
            'Venice CA', 'Koreatown LA', 'Brentwood LA',
            'Woodland Hills CA', 'Sherman Oaks CA', 'Encino CA',
            'Van Nuys CA', 'Northridge CA', 'Pomona CA', 'West Covina CA',
            'Alhambra CA', 'El Monte CA', 'Downey CA', 'Whittier CA',
        ],
        'new york' => [
            'Manhattan NY', 'Brooklyn NY', 'Queens NY', 'Bronx NY', 'Staten Island NY',
            'Harlem NY', 'Upper West Side NY', 'Upper East Side NY', 'Chelsea NY',
            'SoHo NY', 'Tribeca NY', 'Williamsburg Brooklyn', 'Park Slope Brooklyn',
            'Astoria Queens', 'Flushing Queens', 'Jamaica Queens',
            'Yonkers NY', 'White Plains NY', 'New Rochelle NY',
            'Jersey City NJ', 'Hoboken NJ', 'Newark NJ', 'Stamford CT',
        ],
        'chicago' => [
            'Loop Chicago', 'Lincoln Park Chicago', 'Wicker Park Chicago', 'Logan Square Chicago',
            'Lakeview Chicago', 'Hyde Park Chicago', 'Pilsen Chicago',
            'Evanston IL', 'Oak Park IL', 'Naperville IL', 'Schaumburg IL',
            'Aurora IL', 'Joliet IL', 'Cicero IL', 'Berwyn IL',
            'Des Plaines IL', 'Arlington Heights IL', 'Skokie IL', 'Waukegan IL',
        ],
        'phoenix' => [
            'Scottsdale AZ', 'Mesa AZ', 'Tempe AZ', 'Chandler AZ', 'Gilbert AZ',
            'Glendale AZ', 'Peoria AZ', 'Surprise AZ', 'Goodyear AZ',
            'Avondale AZ', 'Cave Creek AZ', 'Fountain Hills AZ', 'Paradise Valley AZ',
            'Downtown Phoenix', 'Arcadia Phoenix', 'Ahwatukee Phoenix', 'Camelback Phoenix',
        ],
        'philadelphia' => [
            'Center City Philadelphia', 'Old City Philadelphia', 'South Philadelphia',
            'Northern Liberties Philadelphia', 'Fishtown Philadelphia', 'Manayunk Philadelphia',
            'Cherry Hill NJ', 'Camden NJ', 'King of Prussia PA', 'Conshohocken PA',
            'Norristown PA', 'Media PA', 'Upper Darby PA', 'Wilmington DE',
            'Bala Cynwyd PA', 'Ardmore PA',
        ],
        'san antonio' => [
            'Downtown San Antonio', 'Alamo Heights TX', 'Stone Oak San Antonio',
            'Medical Center San Antonio', 'Helotes TX', 'Leon Valley TX',
            'Converse TX', 'Live Oak TX', 'Universal City TX', 'Schertz TX',
            'New Braunfels TX', 'Boerne TX', 'Southtown San Antonio',
            'Pearl District San Antonio', 'Dominion San Antonio',
        ],
        'san diego' => [
            'Downtown San Diego', 'La Jolla CA', 'Pacific Beach CA', 'Ocean Beach CA',
            'North Park San Diego', 'Hillcrest San Diego', 'Mission Valley San Diego',
            'Chula Vista CA', 'Oceanside CA', 'Escondido CA', 'Carlsbad CA',
            'Encinitas CA', 'El Cajon CA', 'National City CA', 'Coronado CA', 'Poway CA',
        ],
        'austin' => [
            'Downtown Austin', 'South Congress Austin', 'East Austin', 'Domain Austin',
            'Round Rock TX', 'Cedar Park TX', 'Pflugerville TX', 'Georgetown TX',
            'Lakeway TX', 'Bee Cave TX', 'Kyle TX', 'Buda TX', 'Leander TX',
            'Westlake Hills TX', 'Dripping Springs TX',
        ],
        'miami' => [
            'Downtown Miami', 'South Beach Miami', 'Brickell Miami', 'Wynwood Miami',
            'Coral Gables FL', 'Coconut Grove FL', 'Little Havana Miami',
            'Hialeah FL', 'Miami Beach FL', 'Fort Lauderdale FL',
            'Hollywood FL', 'Pembroke Pines FL', 'Miramar FL',
            'Doral FL', 'Kendall FL', 'Homestead FL', 'Aventura FL', 'Sunny Isles FL',
        ],
        'atlanta' => [
            'Midtown Atlanta', 'Buckhead Atlanta', 'Decatur GA', 'Marietta GA',
            'Sandy Springs GA', 'Roswell GA', 'Alpharetta GA', 'Kennesaw GA',
            'Duluth GA', 'Lawrenceville GA', 'Smyrna GA', 'East Point GA',
            'Grant Park Atlanta', 'Virginia Highland Atlanta', 'Brookhaven GA',
        ],
        'seattle' => [
            'Downtown Seattle', 'Capitol Hill Seattle', 'Fremont Seattle', 'Ballard Seattle',
            'Queen Anne Seattle', 'Bellevue WA', 'Redmond WA', 'Kirkland WA',
            'Renton WA', 'Kent WA', 'Federal Way WA', 'Everett WA',
            'Tacoma WA', 'Bothell WA', 'Issaquah WA', 'Lynnwood WA',
        ],
        'denver' => [
            'Downtown Denver', 'LoDo Denver', 'Capitol Hill Denver', 'Cherry Creek Denver',
            'Aurora CO', 'Lakewood CO', 'Arvada CO', 'Westminster CO',
            'Littleton CO', 'Thornton CO', 'Broomfield CO', 'Boulder CO',
            'Centennial CO', 'Parker CO', 'Highlands Ranch CO',
        ],
        'nashville' => [
            'Downtown Nashville', 'East Nashville', 'Germantown Nashville', 'The Gulch Nashville',
            'Brentwood TN', 'Franklin TN', 'Murfreesboro TN', 'Hendersonville TN',
            'Mount Juliet TN', 'Smyrna TN', 'Gallatin TN', 'Antioch Nashville',
            'Green Hills Nashville', 'Belle Meade Nashville',
        ],
        'san francisco' => [
            'SoMa San Francisco', 'Mission District SF', 'Castro SF', 'Haight Ashbury SF',
            'Richmond District SF', 'Sunset District SF', 'North Beach SF',
            'Nob Hill SF', 'Pacific Heights SF', 'Oakland CA', 'Berkeley CA',
            'San Mateo CA', 'Daly City CA', 'South San Francisco CA', 'Palo Alto CA',
            'Mountain View CA', 'Fremont CA', 'Hayward CA',
        ],
        'tampa' => [
            'Downtown Tampa', 'Ybor City Tampa', 'South Tampa', 'Westchase Tampa',
            'Brandon FL', 'Riverview FL', 'Wesley Chapel FL', 'Clearwater FL',
            'St Petersburg FL', 'Largo FL', 'Palm Harbor FL', 'Temple Terrace FL',
            'Plant City FL', 'Lutz FL', 'Land O Lakes FL',
        ],
        'charlotte' => [
            'Uptown Charlotte', 'South End Charlotte', 'NoDa Charlotte', 'Plaza Midwood Charlotte',
            'Huntersville NC', 'Concord NC', 'Gastonia NC', 'Rock Hill SC',
            'Matthews NC', 'Mint Hill NC', 'Indian Trail NC', 'Mooresville NC',
            'Kannapolis NC', 'Fort Mill SC',
        ],
        'portland' => [
            'Downtown Portland', 'Pearl District Portland', 'Alberta Arts Portland',
            'Hawthorne Portland', 'Southeast Portland', 'Northeast Portland',
            'Beaverton OR', 'Hillsboro OR', 'Tigard OR', 'Lake Oswego OR',
            'Gresham OR', 'Milwaukie OR', 'Tualatin OR', 'West Linn OR',
        ],
        'detroit' => [
            'Downtown Detroit', 'Midtown Detroit', 'Corktown Detroit', 'Dearborn MI',
            'Ann Arbor MI', 'Troy MI', 'Southfield MI', 'Royal Oak MI',
            'Sterling Heights MI', 'Warren MI', 'Livonia MI', 'Canton MI',
            'Novi MI', 'Farmington Hills MI', 'Pontiac MI',
        ],
        'jacksonville' => [
            'Downtown Jacksonville', 'San Marco Jacksonville', 'Riverside Jacksonville',
            'Avondale Jacksonville', 'Mandarin Jacksonville', 'Baymeadows Jacksonville',
            'Orange Park FL', 'Fleming Island FL', 'St Augustine FL',
            'Jacksonville Beach FL', 'Atlantic Beach FL', 'Ponte Vedra FL',
            'Fernandina Beach FL', 'Middleburg FL',
        ],
        'columbus' => [
            'Downtown Columbus OH', 'Short North Columbus', 'German Village Columbus',
            'Clintonville Columbus', 'Dublin OH', 'Westerville OH', 'Grove City OH',
            'Hilliard OH', 'Reynoldsburg OH', 'Upper Arlington OH',
            'Gahanna OH', 'Pickerington OH', 'Delaware OH', 'Powell OH',
        ],
        'indianapolis' => [
            'Downtown Indianapolis', 'Broad Ripple Indianapolis', 'Fountain Square Indianapolis',
            'Carmel IN', 'Fishers IN', 'Noblesville IN', 'Greenwood IN',
            'Lawrence IN', 'Plainfield IN', 'Avon IN', 'Zionsville IN',
            'Brownsburg IN', 'Westfield IN',
        ],
        'orlando' => [
            'Downtown Orlando', 'Winter Park FL', 'Kissimmee FL', 'Sanford FL',
            'Altamonte Springs FL', 'Oviedo FL', 'Lake Mary FL', 'Clermont FL',
            'Apopka FL', 'Winter Garden FL', 'Daytona Beach FL',
            'Dr Phillips Orlando', 'College Park Orlando', 'Windermere FL',
        ],
        'las vegas' => [
            'Downtown Las Vegas', 'The Strip Las Vegas', 'Summerlin NV',
            'Henderson NV', 'North Las Vegas NV', 'Spring Valley NV',
            'Enterprise NV', 'Paradise NV', 'Green Valley Henderson',
            'Centennial Hills NV', 'Boulder City NV', 'Pahrump NV',
        ],
        'minneapolis' => [
            'Downtown Minneapolis', 'Uptown Minneapolis', 'Northeast Minneapolis',
            'St Paul MN', 'Bloomington MN', 'Plymouth MN', 'Edina MN',
            'Brooklyn Park MN', 'Maple Grove MN', 'Eagan MN',
            'Burnsville MN', 'Woodbury MN', 'Eden Prairie MN', 'Minnetonka MN',
        ],
        'boston' => [
            'Downtown Boston', 'Back Bay Boston', 'South End Boston', 'Beacon Hill Boston',
            'Cambridge MA', 'Somerville MA', 'Brookline MA', 'Newton MA',
            'Quincy MA', 'Braintree MA', 'Framingham MA', 'Waltham MA',
            'Medford MA', 'Malden MA', 'Chelsea MA',
        ],
        'baltimore' => [
            'Downtown Baltimore', 'Inner Harbor Baltimore', 'Fells Point Baltimore',
            'Canton Baltimore', 'Federal Hill Baltimore', 'Towson MD',
            'Columbia MD', 'Ellicott City MD', 'Catonsville MD',
            'Dundalk MD', 'Owings Mills MD', 'Pikesville MD',
            'Glen Burnie MD', 'Annapolis MD',
        ],
        'sacramento' => [
            'Downtown Sacramento', 'Midtown Sacramento', 'East Sacramento',
            'Elk Grove CA', 'Roseville CA', 'Folsom CA', 'Rancho Cordova CA',
            'Citrus Heights CA', 'Rocklin CA', 'Davis CA', 'Woodland CA',
            'West Sacramento CA', 'Natomas Sacramento', 'Arden Sacramento',
        ],
        'kansas city' => [
            'Downtown Kansas City', 'Plaza Kansas City', 'Westport Kansas City',
            'Overland Park KS', 'Olathe KS', 'Lees Summit MO', 'Independence MO',
            'Shawnee KS', 'Lenexa KS', 'Blue Springs MO', 'Liberty MO',
            'Gladstone MO', 'Raytown MO', 'Prairie Village KS',
        ],
        'st louis' => [
            'Downtown St Louis', 'Central West End St Louis', 'Soulard St Louis',
            'Clayton MO', 'Chesterfield MO', 'Florissant MO', 'OFallon MO',
            'St Peters MO', 'St Charles MO', 'Ballwin MO', 'Kirkwood MO',
            'Webster Groves MO', 'Edwardsville IL', 'Belleville IL',
        ],
        'milwaukee' => [
            'Downtown Milwaukee', 'Third Ward Milwaukee', 'Bay View Milwaukee',
            'Wauwatosa WI', 'Brookfield WI', 'West Allis WI', 'Waukesha WI',
            'New Berlin WI', 'Greenfield WI', 'Oak Creek WI',
            'Franklin WI', 'Menomonee Falls WI', 'Muskego WI',
        ],
    ];

    // If city is in hardcoded list, return those sub-areas
    if (!empty($metros[$city])) {
        return $metros[$city];
    }

    // 🚀 DYNAMIC GEO-EXPANSION: Auto-generate sub-areas for ANY city
    // Uses Serper Places to discover nearby cities/neighborhoods
    return dynamicGeoExpansion($city);
}

/**
 * Dynamic geo-expansion for cities NOT in the hardcoded metro list.
 * Uses AI (OpenAI) to find surrounding cities within 20-25 miles,
 * with Serper fallback and programmatic patterns.
 * Results cached to file for 7 days.
 */
function dynamicGeoExpansion(string $city): array {
    if (empty($city)) return [];

    // File-based cache (7-day TTL) — more reliable than in-memory
    $cacheDir = defined('CACHE_DIR') ? CACHE_DIR : __DIR__ . '/cache';
    if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
    $cacheFile = $cacheDir . '/geo_expand_' . md5(strtolower($city)) . '.json';

    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && isset($cached['expires']) && $cached['expires'] > time()) {
            error_log("[Geo Expansion] Cache hit for '$city' (" . count($cached['areas'] ?? []) . " areas)");
            return $cached['areas'] ?? [];
        }
    }

    $subAreas = [];

    // ========== METHOD 1: AI-powered city expansion (most accurate) ==========
    if (defined('OPENAI_API_KEY') && !empty(OPENAI_API_KEY) && strpos(OPENAI_API_KEY, 'YOUR_') === false) {
        $prompt = "List exactly 25 real cities, towns, and neighborhoods within a 20-25 mile radius of \"$city\", United States. Include surrounding suburbs, adjacent cities, and well-known neighborhoods. Format each with the state abbreviation (e.g., 'Sugar Land TX', 'Katy TX', 'Midtown Houston'). Return ONLY a JSON object with key \"areas\" containing an array of strings. No explanations.";

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        $data = [
            'model' => 'gpt-4o-mini',
            'messages' => [['role' => 'user', 'content' => $prompt]],
            'temperature' => 0.3,
            'max_tokens' => 500,
            'response_format' => ['type' => 'json_object']
        ];

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . OPENAI_API_KEY,
                'Content-Type: application/json'
            ],
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $result = json_decode($response, true);
            $content = $result['choices'][0]['message']['content'] ?? null;
            if ($content) {
                $parsed = json_decode($content, true);
                $aiAreas = $parsed['areas'] ?? [];
                if (is_array($aiAreas) && !empty($aiAreas)) {
                    $subAreas = array_map('trim', $aiAreas);
                    error_log("[Geo Expansion] AI generated " . count($subAreas) . " areas for '$city'");
                }
            }
        } else {
            error_log("[Geo Expansion] AI call failed for '$city' (HTTP $httpCode)");
        }
    }

    // ========== METHOD 2: Serper fallback (if AI didn't produce enough) ==========
    if (count($subAreas) < 10 && defined('SERPER_API_KEY') && !empty(SERPER_API_KEY)) {
        $queries = [
            "cities and towns near $city",
            "neighborhoods in $city",
            "suburbs of $city",
        ];

        foreach ($queries as $query) {
            $ch = curl_init('https://google.serper.dev/search');
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode(['q' => $query, 'gl' => 'us', 'hl' => 'en', 'num' => 10]),
                CURLOPT_HTTPHEADER     => [
                    'X-API-KEY: ' . SERPER_API_KEY,
                    'Content-Type: application/json',
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 5,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);

            $response = curl_exec($ch);
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && !empty($response)) {
                $data = json_decode($response, true);
                if (!empty($data['organic'])) {
                    foreach ($data['organic'] as $result) {
                        $snippet = ($result['snippet'] ?? '') . ' ' . ($result['title'] ?? '');
                        if (preg_match_all('/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/', $snippet, $matches)) {
                            foreach ($matches[1] as $place) {
                                $placeLower = strtolower($place);
                                if (in_array($placeLower, ['the', 'and', 'for', 'with', 'from', 'near', 'city', 'town', 'village', 'county', 'state', 'area', 'region', 'district', 'north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'downtown', 'uptown', 'midtown', 'united', 'states', 'america', 'miles', 'population', 'located', 'including'])) {
                                    continue;
                                }
                                if (strlen($place) > 3 && strtolower($place) !== strtolower($city)) {
                                    $subAreas[] = $place;
                                }
                            }
                        }
                    }
                }
                if (!empty($data['relatedSearches'])) {
                    foreach ($data['relatedSearches'] as $rs) {
                        $q = $rs['query'] ?? '';
                        if (preg_match('/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/', $q, $m)) {
                            $place = $m[1];
                            if (strtolower($place) !== strtolower($city) && strlen($place) > 3) {
                                $subAreas[] = $place;
                            }
                        }
                    }
                }
            }
            usleep(50000);
        }
    }

    // ========== METHOD 3: Programmatic patterns (always as supplement) ==========
    $programmaticAreas = [
        "Downtown $city",
        "North $city",
        "South $city",
        "East $city",
        "West $city",
        "Central $city",
        "$city Heights",
        "$city Park",
        "$city Valley",
        "$city Hills",
    ];
    $subAreas = array_merge($subAreas, $programmaticAreas);

    // Deduplicate, clean, and limit
    $subAreas = array_values(array_unique(array_filter($subAreas, function($a) { return strlen(trim($a)) > 2; })));
    $subAreas = array_slice($subAreas, 0, 30);

    // Cache for 7 days
    @file_put_contents($cacheFile, json_encode([
        'city' => $city,
        'areas' => $subAreas,
        'expires' => time() + (7 * 86400),
        'generated' => date('Y-m-d H:i:s'),
        'source' => count($subAreas) > 10 ? 'ai+serper' : 'serper+programmatic',
    ]));

    error_log("[Geo Expansion] Final: " . count($subAreas) . " areas for '$city' (cached 7 days)");
    return $subAreas;
}

/**
 * City-to-state mapping for grid queries
 */
function getGridCityStateMap(): array {
    return [
        'houston' => 'TX', 'dallas' => 'TX', 'austin' => 'TX', 'san antonio' => 'TX',
        'fort worth' => 'TX', 'el paso' => 'TX',
        'los angeles' => 'CA', 'san francisco' => 'CA', 'san diego' => 'CA',
        'san jose' => 'CA', 'sacramento' => 'CA',
        'new york' => 'NY', 'chicago' => 'IL', 'phoenix' => 'AZ',
        'philadelphia' => 'PA', 'jacksonville' => 'FL', 'miami' => 'FL',
        'tampa' => 'FL', 'orlando' => 'FL',
        'seattle' => 'WA', 'denver' => 'CO', 'nashville' => 'TN',
        'atlanta' => 'GA', 'charlotte' => 'NC', 'portland' => 'OR',
        'detroit' => 'MI', 'minneapolis' => 'MN', 'las vegas' => 'NV',
        'boston' => 'MA', 'baltimore' => 'MD', 'columbus' => 'OH',
        'indianapolis' => 'IN', 'kansas city' => 'MO', 'st louis' => 'MO',
        'milwaukee' => 'WI',
    ];
}
