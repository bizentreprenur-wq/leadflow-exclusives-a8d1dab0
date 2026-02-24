<?php
/**
 * Shared helper functions for BamLead API
 */

require_once __DIR__ . '/../config.php';

/**
 * Send SSE (Server-Sent Events) message — globally available for streaming endpoints.
 */
if (!function_exists('sendSSE')) {
    function sendSSE($event, $data) {
        echo "event: {$event}\n";
        echo "data: " . json_encode($data) . "\n\n";
        if (ob_get_level()) ob_flush();
        flush();
    }
}

/**
 * Send SSE error helper
 */
if (!function_exists('sendSSEError')) {
    function sendSSEError($message) {
        sendSSE('error', ['error' => $message]);
    }
}

/**
 * Check if origin is a Lovable preview/project domain
 */
function isLovableOrigin($origin) {
    // Match all Lovable domains more permissively
    // Patterns: *.lovableproject.com, *.lovable.app, any subdomain combination
    return preg_match('/^https:\/\/[a-z0-9\-\.]+\.lovableproject\.com$/i', $origin) ||
           preg_match('/^https:\/\/[a-z0-9\-\.]+\.lovable\.app$/i', $origin) ||
           strpos($origin, 'lovableproject.com') !== false ||
           strpos($origin, 'lovable.app') !== false;
}

/**
 * Set CORS headers for API responses
 */
function setCorsHeaders() {
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    $isAllowed = false;
    
    // Check explicit whitelist first
    if (defined('ALLOWED_ORIGINS') && in_array($origin, ALLOWED_ORIGINS)) {
        $isAllowed = true;
    }
    // Allow all Lovable preview/project domains dynamically
    elseif (isLovableOrigin($origin)) {
        $isAllowed = true;
    }
    // In dev mode, allow localhost origins
    elseif (defined('DEBUG_MODE') && DEBUG_MODE) {
        if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
            $isAllowed = true;
        }
    }
    
    if ($isAllowed) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }
    // If origin not allowed, don't set CORS header - browser will block
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    
    // Security headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // CSP for API responses (JSON)
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Send JSON response
 */
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

/**
 * Send error response
 */
function sendError($message, $statusCode = 400) {
    sendJson(['success' => false, 'error' => $message], $statusCode);
}

/**
 * Get JSON input from request body
 */
function getJsonInput() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }
    return $input;
}

/**
 * Sanitize string input
 */
function sanitizeInput($input, $maxLength = 100) {
    if (!is_string($input)) {
        return '';
    }
    $input = trim($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    if (strlen($input) > $maxLength) {
        $input = substr($input, 0, $maxLength);
    }
    return $input;
}

/**
 * Build a list of expanded location variants to increase result volume.
 * Keeps the original location out of the list and preserves order.
 */
function buildLocationExpansions($location) {
    $clean = preg_replace('/\s+/', ' ', trim((string)$location));
    if ($clean === '') {
        return [];
    }

    $expansions = [];
    $variants = ['area', 'metro', 'metro area', 'suburbs', 'downtown', 'nearby'];
    foreach ($variants as $variant) {
        $expansions[] = "{$clean} {$variant}";
    }

    $city = '';
    $state = '';
    if (strpos($clean, ',') !== false) {
        $parts = array_map('trim', explode(',', $clean, 2));
        $city = $parts[0] ?? '';
        $state = $parts[1] ?? '';
    } else {
        // Smart detection: if input is a single word/phrase that looks like a city name
        // (not a state name), treat it as a city and try to resolve the state
        $normalizedState = normalizeStateCode($clean);
        if ($normalizedState && strlen($normalizedState) === 2 && strcasecmp($clean, $normalizedState) === 0) {
            // It's actually a state abbreviation like "TX"
            $state = $clean;
        } else {
            // Treat as a city name — try to look up state from nearby city shards
            $city = $clean;
            // Try common city-to-state mapping for major US cities
            $cityStateMap = [
                'houston' => 'TX', 'dallas' => 'TX', 'austin' => 'TX', 'san antonio' => 'TX', 'fort worth' => 'TX', 'el paso' => 'TX', 'arlington' => 'TX', 'plano' => 'TX',
                'los angeles' => 'CA', 'san francisco' => 'CA', 'san diego' => 'CA', 'san jose' => 'CA', 'sacramento' => 'CA', 'fresno' => 'CA', 'oakland' => 'CA', 'long beach' => 'CA',
                'new york' => 'NY', 'brooklyn' => 'NY', 'queens' => 'NY', 'bronx' => 'NY', 'manhattan' => 'NY', 'buffalo' => 'NY', 'rochester' => 'NY',
                'chicago' => 'IL', 'naperville' => 'IL', 'aurora' => 'IL', 'springfield' => 'IL',
                'phoenix' => 'AZ', 'tucson' => 'AZ', 'mesa' => 'AZ', 'scottsdale' => 'AZ', 'chandler' => 'AZ',
                'philadelphia' => 'PA', 'pittsburgh' => 'PA',
                'jacksonville' => 'FL', 'miami' => 'FL', 'tampa' => 'FL', 'orlando' => 'FL', 'fort lauderdale' => 'FL', 'st petersburg' => 'FL',
                'columbus' => 'OH', 'cleveland' => 'OH', 'cincinnati' => 'OH',
                'indianapolis' => 'IN', 'fort wayne' => 'IN',
                'charlotte' => 'NC', 'raleigh' => 'NC', 'durham' => 'NC', 'greensboro' => 'NC',
                'seattle' => 'WA', 'tacoma' => 'WA', 'spokane' => 'WA',
                'denver' => 'CO', 'colorado springs' => 'CO', 'aurora' => 'CO',
                'nashville' => 'TN', 'memphis' => 'TN', 'knoxville' => 'TN',
                'detroit' => 'MI', 'grand rapids' => 'MI', 'ann arbor' => 'MI',
                'portland' => 'OR', 'salem' => 'OR', 'eugene' => 'OR',
                'las vegas' => 'NV', 'reno' => 'NV', 'henderson' => 'NV',
                'atlanta' => 'GA', 'savannah' => 'GA', 'augusta' => 'GA',
                'boston' => 'MA', 'cambridge' => 'MA', 'worcester' => 'MA',
                'baltimore' => 'MD', 'annapolis' => 'MD',
                'milwaukee' => 'WI', 'madison' => 'WI',
                'minneapolis' => 'MN', 'st paul' => 'MN',
                'new orleans' => 'LA', 'baton rouge' => 'LA',
                'kansas city' => 'MO', 'st louis' => 'MO',
                'oklahoma city' => 'OK', 'tulsa' => 'OK',
                'omaha' => 'NE', 'lincoln' => 'NE',
                'richmond' => 'VA', 'virginia beach' => 'VA', 'norfolk' => 'VA',
                'salt lake city' => 'UT', 'provo' => 'UT',
                'birmingham' => 'AL', 'montgomery' => 'AL', 'huntsville' => 'AL',
                'louisville' => 'KY', 'lexington' => 'KY',
                'hartford' => 'CT', 'new haven' => 'CT',
                'providence' => 'RI',
                'honolulu' => 'HI',
                'anchorage' => 'AK',
                'albuquerque' => 'NM', 'santa fe' => 'NM',
                'charleston' => 'SC', 'columbia' => 'SC',
                'des moines' => 'IA', 'cedar rapids' => 'IA',
                'little rock' => 'AR', 'fayetteville' => 'AR',
                'boise' => 'ID',
            ];
            $state = $cityStateMap[strtolower($city)] ?? '';
        }
    }

    if ($city && $state) {
        $cityState = "{$city}, {$state}";
        $expansions[] = $cityState;
        $expansions[] = "{$cityState} metro";
        $expansions[] = "{$cityState} suburbs";
        $expansions[] = "{$cityState} downtown";
        foreach (['north', 'south', 'east', 'west'] as $direction) {
            $expansions[] = "{$direction} {$city}, {$state}";
        }

        $enableRadiusExpansion = defined('ENABLE_RADIUS_LOCATION_EXPANSION') ? (bool)ENABLE_RADIUS_LOCATION_EXPANSION : true;
        $radiusMiles = defined('LOCATION_EXPANSION_RADIUS_MILES') ? max(5, (int)LOCATION_EXPANSION_RADIUS_MILES) : 60;
        if ($enableRadiusExpansion) {
            $nearbyCityShards = getNearbyCityShards($city, $state, $radiusMiles);
            foreach ($nearbyCityShards as $nearbyCity) {
                $expansions[] = $nearbyCity;
                $expansions[] = "{$nearbyCity} metro";
            }
        }
    } elseif ($city && !$state) {
        // City without state — still add directional expansions
        foreach (['north', 'south', 'east', 'west'] as $direction) {
            $expansions[] = "{$direction} {$city}";
        }
        $expansions[] = "{$city} downtown";
        $expansions[] = "{$city} suburbs";
    }

    // For broad state-level searches (e.g., "Texas"), add major city shards
    // to increase unique lead coverage.
    $stateCityShards = getStateCityShards($state ?: $clean);
    foreach ($stateCityShards as $cityShard) {
        $expansions[] = $cityShard;
        $expansions[] = "{$cityShard} metro";
    }

    $includeState = defined('LOCATION_EXPANSION_INCLUDE_STATE') ? LOCATION_EXPANSION_INCLUDE_STATE : false;
    if ($includeState && $state) {
        $expansions[] = $state;
    }

    $includeCountry = defined('LOCATION_EXPANSION_INCLUDE_COUNTRY') ? LOCATION_EXPANSION_INCLUDE_COUNTRY : false;
    if ($includeCountry) {
        $expansions[] = 'United States';
    }

    $unique = [];
    foreach ($expansions as $loc) {
        $loc = preg_replace('/\s+/', ' ', trim($loc));
        if ($loc === '' || strcasecmp($loc, $clean) === 0) {
            continue;
        }
        if (!in_array($loc, $unique, true)) {
            $unique[] = $loc;
        }
    }

    return $unique;
}

/**
 * Normalize state input to 2-letter code (US-focused).
 */
function normalizeStateCode($stateInput) {
    $normalized = strtolower(trim((string)$stateInput));
    if ($normalized === '') {
        return '';
    }

    $normalized = preg_replace('/\s+/', ' ', $normalized);
    $normalized = trim($normalized, " ,.");

    $aliases = [
        'alabama' => 'al', 'al' => 'al',
        'alaska' => 'ak', 'ak' => 'ak',
        'arizona' => 'az', 'az' => 'az',
        'arkansas' => 'ar', 'ar' => 'ar',
        'california' => 'ca', 'ca' => 'ca',
        'colorado' => 'co', 'co' => 'co',
        'connecticut' => 'ct', 'ct' => 'ct',
        'delaware' => 'de', 'de' => 'de',
        'district of columbia' => 'dc', 'dc' => 'dc',
        'florida' => 'fl', 'fl' => 'fl',
        'georgia' => 'ga', 'ga' => 'ga',
        'hawaii' => 'hi', 'hi' => 'hi',
        'idaho' => 'id', 'id' => 'id',
        'illinois' => 'il', 'il' => 'il',
        'indiana' => 'in', 'in' => 'in',
        'iowa' => 'ia', 'ia' => 'ia',
        'kansas' => 'ks', 'ks' => 'ks',
        'kentucky' => 'ky', 'ky' => 'ky',
        'louisiana' => 'la', 'la' => 'la',
        'maine' => 'me', 'me' => 'me',
        'maryland' => 'md', 'md' => 'md',
        'massachusetts' => 'ma', 'ma' => 'ma',
        'michigan' => 'mi', 'mi' => 'mi',
        'minnesota' => 'mn', 'mn' => 'mn',
        'mississippi' => 'ms', 'ms' => 'ms',
        'missouri' => 'mo', 'mo' => 'mo',
        'montana' => 'mt', 'mt' => 'mt',
        'nebraska' => 'ne', 'ne' => 'ne',
        'nevada' => 'nv', 'nv' => 'nv',
        'new hampshire' => 'nh', 'nh' => 'nh',
        'new jersey' => 'nj', 'nj' => 'nj',
        'new mexico' => 'nm', 'nm' => 'nm',
        'new york' => 'ny', 'ny' => 'ny',
        'north carolina' => 'nc', 'nc' => 'nc',
        'north dakota' => 'nd', 'nd' => 'nd',
        'ohio' => 'oh', 'oh' => 'oh',
        'oklahoma' => 'ok', 'ok' => 'ok',
        'oregon' => 'or', 'or' => 'or',
        'pennsylvania' => 'pa', 'pa' => 'pa',
        'rhode island' => 'ri', 'ri' => 'ri',
        'south carolina' => 'sc', 'sc' => 'sc',
        'south dakota' => 'sd', 'sd' => 'sd',
        'tennessee' => 'tn', 'tn' => 'tn',
        'texas' => 'tx', 'tx' => 'tx',
        'utah' => 'ut', 'ut' => 'ut',
        'vermont' => 'vt', 'vt' => 'vt',
        'virginia' => 'va', 'va' => 'va',
        'washington' => 'wa', 'wa' => 'wa',
        'west virginia' => 'wv', 'wv' => 'wv',
        'wisconsin' => 'wi', 'wi' => 'wi',
        'wyoming' => 'wy', 'wy' => 'wy',
    ];

    return $aliases[$normalized] ?? $normalized;
}

/**
 * Normalize city names for stable map lookup.
 */
function normalizeCityKey($cityInput) {
    $city = strtolower(trim((string)$cityInput));
    $city = preg_replace('/[^a-z0-9\s]/', ' ', $city);
    $city = preg_replace('/\s+/', ' ', $city);
    return trim($city);
}

/**
 * Return nearby city shards by metro for radius-style expansion.
 * Distances are approximate and curated for practical lead coverage.
 */
function getNearbyCityShards($cityInput, $stateInput, $radiusMiles = 40) {
    $state = normalizeStateCode($stateInput);
    $city = normalizeCityKey($cityInput);
    if ($city === '' || $state === '') {
        return [];
    }

    $radiusMiles = max(5, (int)$radiusMiles);
    $metroKey = "{$city},{$state}";

    $metroMap = [
        'houston,tx' => [
            10 => ['Bellaire, TX', 'West University Place, TX', 'Southside Place, TX', 'River Oaks, TX', 'Memorial, TX', 'The Heights, TX', 'Montrose, TX', 'Midtown, TX', 'East End, TX', 'Garden Oaks, TX', 'Oak Forest, TX', 'Sunnyside, TX'],
            15 => ['Pasadena, TX', 'South Houston, TX', 'Galena Park, TX', 'Jacinto City, TX', 'Hunters Creek Village, TX', 'Piney Point Village, TX', 'Bunker Hill Village, TX', 'Hedwig Village, TX', 'Spring Valley Village, TX', 'Hilshire Village, TX', 'Jersey Village, TX', 'Meadows Place, TX'],
            25 => ['Pearland, TX', 'Sugar Land, TX', 'Missouri City, TX', 'Katy, TX', 'Stafford, TX', 'Friendswood, TX', 'Deer Park, TX', 'La Porte, TX', 'Channelview, TX', 'Highlands, TX', 'Sheldon, TX', 'Cinco Ranch, TX', 'Greatwood, TX', 'Sienna, TX'],
            40 => ['League City, TX', 'Baytown, TX', 'Cypress, TX', 'Spring, TX', 'Klein, TX', 'The Woodlands, TX', 'Tomball, TX', 'Humble, TX', 'Atascocita, TX', 'Kingwood, TX', 'Richmond, TX', 'Rosenberg, TX', 'Conroe, TX', 'Webster, TX', 'Clear Lake, TX', 'Clear Lake Shores, TX', 'Alvin, TX', 'Dickinson, TX', 'Texas City, TX', 'Seabrook, TX', 'Kemah, TX', 'El Lago, TX', 'Nassau Bay, TX', 'Magnolia, TX', 'Fulshear, TX', 'Brookshire, TX', 'Manvel, TX', 'Iowa Colony, TX', 'Fresno, TX', 'Rosharon, TX', 'Oak Ridge North, TX', 'Shenandoah, TX', 'Bridgeland, TX', 'La Marque, TX', 'Santa Fe, TX'],
            60 => ['Galveston, TX', 'Angleton, TX', 'Lake Jackson, TX', 'Clute, TX', 'Huntsville, TX', 'Navasota, TX', 'Brenham, TX', 'Columbus, TX', 'Wharton, TX', 'El Campo, TX', 'Bay City, TX', 'Needville, TX', 'Hempstead, TX', 'Prairie View, TX', 'Waller, TX', 'Hockley, TX', 'Pattison, TX', 'Willis, TX', 'New Caney, TX', 'Porter, TX', 'Splendora, TX', 'Dayton, TX', 'Liberty, TX', 'Mont Belvieu, TX', 'Crosby, TX'],
        ],
        'dallas,tx' => [
            15 => ['Irving, TX', 'Grand Prairie, TX', 'Mesquite, TX', 'University Park, TX', 'Highland Park, TX', 'Farmers Branch, TX'],
            25 => ['Plano, TX', 'Garland, TX', 'Richardson, TX', 'Arlington, TX', 'Addison, TX', 'Coppell, TX', 'Duncanville, TX', 'DeSoto, TX', 'Cedar Hill, TX', 'Lancaster, TX'],
            40 => ['Frisco, TX', 'McKinney, TX', 'Carrollton, TX', 'Lewisville, TX', 'Denton, TX', 'Fort Worth, TX', 'Allen, TX', 'Wylie, TX', 'Rowlett, TX', 'Rockwall, TX', 'Sachse, TX', 'Murphy, TX', 'The Colony, TX', 'Little Elm, TX', 'Prosper, TX', 'Celina, TX', 'Mansfield, TX', 'Euless, TX', 'Bedford, TX', 'Hurst, TX', 'Grapevine, TX', 'Southlake, TX', 'Keller, TX', 'North Richland Hills, TX', 'Colleyville, TX', 'Flower Mound, TX', 'Highland Village, TX'],
            60 => ['Weatherford, TX', 'Cleburne, TX', 'Midlothian, TX', 'Waxahachie, TX', 'Ennis, TX', 'Corsicana, TX', 'Greenville, TX', 'Sherman, TX', 'Gainesville, TX', 'Mineral Wells, TX', 'Granbury, TX', 'Stephenville, TX'],
        ],
        'austin,tx' => [
            15 => ['Round Rock, TX', 'Pflugerville, TX', 'West Lake Hills, TX', 'Rollingwood, TX'],
            25 => ['Cedar Park, TX', 'Leander, TX', 'Georgetown, TX', 'Hutto, TX', 'Manor, TX', 'Lakeway, TX', 'Bee Cave, TX'],
            40 => ['San Marcos, TX', 'Kyle, TX', 'Buda, TX', 'Dripping Springs, TX', 'Bastrop, TX', 'Taylor, TX', 'Elgin, TX', 'Liberty Hill, TX', 'Jarrell, TX', 'Florence, TX', 'Lockhart, TX', 'Wimberley, TX'],
        ],
        'san antonio,tx' => [
            15 => ['Balcones Heights, TX', 'Alamo Heights, TX', 'Terrell Hills, TX', 'Olmos Park, TX', 'Castle Hills, TX'],
            25 => ['Schertz, TX', 'Live Oak, TX', 'Converse, TX', 'Universal City, TX', 'Selma, TX', 'Windcrest, TX', 'Leon Valley, TX', 'Kirby, TX'],
            40 => ['New Braunfels, TX', 'Boerne, TX', 'Seguin, TX', 'Helotes, TX', 'Fair Oaks Ranch, TX', 'Cibolo, TX', 'Garden Ridge, TX', 'Bulverde, TX', 'Canyon Lake, TX'],
        ],
        'los angeles,ca' => [
            15 => ['Glendale, CA', 'Pasadena, CA', 'Burbank, CA', 'West Hollywood, CA', 'Beverly Hills, CA', 'Culver City, CA', 'Alhambra, CA'],
            25 => ['Long Beach, CA', 'Santa Monica, CA', 'Inglewood, CA', 'Torrance, CA', 'Compton, CA', 'Downey, CA', 'Norwalk, CA', 'Whittier, CA', 'El Monte, CA', 'Arcadia, CA', 'Monrovia, CA'],
            40 => ['Anaheim, CA', 'Irvine, CA', 'Santa Ana, CA', 'Pomona, CA', 'Ontario, CA', 'Rancho Cucamonga, CA', 'Fullerton, CA', 'Costa Mesa, CA', 'Huntington Beach, CA', 'Garden Grove, CA', 'Thousand Oaks, CA', 'Simi Valley, CA', 'Ventura, CA', 'Oxnard, CA', 'Palmdale, CA', 'Lancaster, CA', 'San Bernardino, CA', 'Riverside, CA', 'Corona, CA'],
        ],
        'san francisco,ca' => [
            10 => ['Daly City, CA', 'South San Francisco, CA', 'Brisbane, CA'],
            15 => ['Oakland, CA', 'Berkeley, CA', 'Emeryville, CA', 'Alameda, CA', 'San Leandro, CA', 'San Bruno, CA', 'Pacifica, CA', 'Millbrae, CA'],
            25 => ['San Mateo, CA', 'Redwood City, CA', 'Burlingame, CA', 'Foster City, CA', 'Hayward, CA', 'Fremont, CA', 'Union City, CA', 'Newark, CA', 'Richmond, CA', 'El Cerrito, CA', 'Albany, CA', 'Sausalito, CA', 'Mill Valley, CA', 'San Rafael, CA', 'Novato, CA', 'Tiburon, CA'],
            40 => ['Palo Alto, CA', 'Mountain View, CA', 'Sunnyvale, CA', 'Santa Clara, CA', 'San Jose, CA', 'Cupertino, CA', 'Los Gatos, CA', 'Campbell, CA', 'Milpitas, CA', 'Pleasanton, CA', 'Livermore, CA', 'Dublin, CA', 'Walnut Creek, CA', 'Concord, CA', 'Antioch, CA', 'Pittsburg, CA', 'Danville, CA', 'San Ramon, CA', 'Orinda, CA', 'Lafayette, CA', 'Moraga, CA'],
            60 => ['Santa Rosa, CA', 'Petaluma, CA', 'Napa, CA', 'Vallejo, CA', 'Benicia, CA', 'Fairfield, CA', 'Vacaville, CA', 'Half Moon Bay, CA', 'Santa Cruz, CA', 'Scotts Valley, CA', 'Gilroy, CA', 'Morgan Hill, CA'],
        ],
        'miami,fl' => [
            15 => ['Hialeah, FL', 'Miami Beach, FL', 'Coral Gables, FL', 'Sweetwater, FL', 'Virginia Gardens, FL'],
            25 => ['Doral, FL', 'North Miami, FL', 'North Miami Beach, FL', 'Aventura, FL', 'Opa-locka, FL', 'Miami Springs, FL', 'Homestead, FL', 'Miami Gardens, FL', 'Hialeah Gardens, FL'],
            40 => ['Fort Lauderdale, FL', 'Hollywood, FL', 'Pembroke Pines, FL', 'Miramar, FL', 'Davie, FL', 'Plantation, FL', 'Sunrise, FL', 'Weston, FL', 'Boca Raton, FL', 'Pompano Beach, FL', 'Deerfield Beach, FL', 'Hallandale Beach, FL', 'Coral Springs, FL', 'Margate, FL', 'Coconut Creek, FL'],
        ],
        'chicago,il' => [
            15 => ['Evanston, IL', 'Oak Park, IL', 'Cicero, IL', 'Berwyn, IL', 'Forest Park, IL', 'Maywood, IL'],
            25 => ['Skokie, IL', 'Naperville, IL', 'Schaumburg, IL', 'Des Plaines, IL', 'Park Ridge, IL', 'Niles, IL', 'Morton Grove, IL', 'Wilmette, IL', 'Lincolnwood, IL'],
            40 => ['Aurora, IL', 'Elgin, IL', 'Joliet, IL', 'Arlington Heights, IL', 'Palatine, IL', 'Buffalo Grove, IL', 'Wheaton, IL', 'Downers Grove, IL', 'Bolingbrook, IL', 'Tinley Park, IL', 'Orland Park, IL', 'Oak Lawn, IL', 'Lombard, IL', 'Addison, IL', 'Carol Stream, IL', 'Waukegan, IL', 'Lake Forest, IL', 'Highland Park, IL'],
        ],
        'new york,ny' => [
            15 => ['Jersey City, NJ', 'Newark, NJ', 'Yonkers, NY', 'Hoboken, NJ', 'Bayonne, NJ'],
            25 => ['Paterson, NJ', 'Elizabeth, NJ', 'Stamford, CT', 'Mount Vernon, NY', 'New Rochelle, NY', 'White Plains, NY', 'Passaic, NJ', 'Clifton, NJ', 'East Orange, NJ'],
            40 => ['Bridgeport, CT', 'Norwalk, CT', 'Hempstead, NY', 'Freeport, NY', 'Valley Stream, NY', 'Garden City, NY', 'Mineola, NY', 'Great Neck, NY', 'Hackensack, NJ', 'Paramus, NJ', 'Fort Lee, NJ', 'Teaneck, NJ', 'Englewood, NJ', 'Bergenfield, NJ', 'Lodi, NJ'],
        ],
        'phoenix,az' => [
            15 => ['Scottsdale, AZ', 'Tempe, AZ', 'Mesa, AZ'],
            25 => ['Chandler, AZ', 'Gilbert, AZ', 'Glendale, AZ', 'Peoria, AZ'],
            40 => ['Surprise, AZ', 'Goodyear, AZ', 'Avondale, AZ', 'Buckeye, AZ', 'Cave Creek, AZ', 'Fountain Hills, AZ', 'Apache Junction, AZ', 'Queen Creek, AZ', 'Maricopa, AZ', 'Casa Grande, AZ'],
        ],
        'atlanta,ga' => [
            15 => ['Decatur, GA', 'East Point, GA', 'College Park, GA'],
            25 => ['Sandy Springs, GA', 'Roswell, GA', 'Brookhaven, GA', 'Dunwoody, GA', 'Smyrna, GA', 'Marietta, GA'],
            40 => ['Alpharetta, GA', 'Johns Creek, GA', 'Kennesaw, GA', 'Lawrenceville, GA', 'Duluth, GA', 'Suwanee, GA', 'Peachtree City, GA', 'Fayetteville, GA', 'McDonough, GA', 'Conyers, GA', 'Covington, GA', 'Douglasville, GA', 'Cartersville, GA', 'Newnan, GA'],
        ],
        'denver,co' => [
            15 => ['Aurora, CO', 'Lakewood, CO', 'Englewood, CO'],
            25 => ['Westminster, CO', 'Arvada, CO', 'Thornton, CO', 'Broomfield, CO', 'Centennial, CO', 'Littleton, CO'],
            40 => ['Boulder, CO', 'Longmont, CO', 'Parker, CO', 'Castle Rock, CO', 'Highlands Ranch, CO', 'Golden, CO', 'Brighton, CO', 'Commerce City, CO', 'Northglenn, CO', 'Federal Heights, CO', 'Wheat Ridge, CO', 'Erie, CO', 'Louisville, CO', 'Lafayette, CO'],
        ],
        'seattle,wa' => [
            15 => ['Bellevue, WA', 'Renton, WA', 'Tukwila, WA'],
            25 => ['Kirkland, WA', 'Redmond, WA', 'Kent, WA', 'Federal Way, WA', 'Burien, WA', 'SeaTac, WA'],
            40 => ['Tacoma, WA', 'Everett, WA', 'Lynnwood, WA', 'Edmonds, WA', 'Shoreline, WA', 'Bothell, WA', 'Woodinville, WA', 'Issaquah, WA', 'Sammamish, WA', 'Auburn, WA', 'Puyallup, WA', 'Lakewood, WA', 'Olympia, WA', 'Marysville, WA'],
        ],
        'philadelphia,pa' => [
            10 => ['Camden, NJ', 'Chester, PA', 'Darby, PA'],
            15 => ['Upper Darby, PA', 'Drexel Hill, PA', 'Norristown, PA', 'Conshohocken, PA', 'Bala Cynwyd, PA', 'Ardmore, PA', 'Bryn Mawr, PA', 'Havertown, PA', 'Springfield, PA', 'Media, PA'],
            25 => ['King of Prussia, PA', 'Plymouth Meeting, PA', 'Blue Bell, PA', 'Lansdale, PA', 'Ambler, PA', 'Willow Grove, PA', 'Abington, PA', 'Cheltenham, PA', 'Jenkintown, PA', 'Wyndmoor, PA', 'Cherry Hill, NJ', 'Collingswood, NJ', 'Haddonfield, NJ', 'Moorestown, NJ', 'Mount Laurel, NJ', 'Marlton, NJ'],
            40 => ['West Chester, PA', 'Exton, PA', 'Downingtown, PA', 'Coatesville, PA', 'Phoenixville, PA', 'Pottstown, PA', 'Doylestown, PA', 'Chalfont, PA', 'Quakertown, PA', 'Levittown, PA', 'Bensalem, PA', 'Bristol, PA', 'Trenton, NJ', 'Princeton, NJ', 'Voorhees, NJ', 'Vineland, NJ', 'Wilmington, DE', 'Newark, DE'],
        ],
        'boston,ma' => [
            10 => ['Cambridge, MA', 'Somerville, MA', 'Brookline, MA', 'Watertown, MA'],
            15 => ['Newton, MA', 'Medford, MA', 'Malden, MA', 'Everett, MA', 'Chelsea, MA', 'Revere, MA', 'Waltham, MA', 'Arlington, MA', 'Belmont, MA', 'Quincy, MA'],
            25 => ['Framingham, MA', 'Natick, MA', 'Needham, MA', 'Wellesley, MA', 'Lexington, MA', 'Winchester, MA', 'Woburn, MA', 'Burlington, MA', 'Reading, MA', 'Stoneham, MA', 'Melrose, MA', 'Braintree, MA', 'Weymouth, MA', 'Hingham, MA', 'Milton, MA', 'Dedham, MA'],
            40 => ['Worcester, MA', 'Lowell, MA', 'Lawrence, MA', 'Haverhill, MA', 'Salem, MA', 'Beverly, MA', 'Gloucester, MA', 'Plymouth, MA', 'Taunton, MA', 'Brockton, MA', 'Fall River, MA', 'New Bedford, MA', 'Providence, RI', 'Cranston, RI', 'Warwick, RI', 'Pawtucket, RI', 'Nashua, NH', 'Manchester, NH'],
        ],
        'detroit,mi' => [
            10 => ['Dearborn, MI', 'Hamtramck, MI', 'Highland Park, MI'],
            15 => ['Southfield, MI', 'Royal Oak, MI', 'Ferndale, MI', 'Berkley, MI', 'Oak Park, MI', 'Redford, MI', 'Allen Park, MI', 'Lincoln Park, MI', 'Wyandotte, MI'],
            25 => ['Troy, MI', 'Sterling Heights, MI', 'Warren, MI', 'Livonia, MI', 'Westland, MI', 'Canton, MI', 'Plymouth, MI', 'Novi, MI', 'Farmington Hills, MI', 'Bloomfield Hills, MI', 'Birmingham, MI', 'Clawson, MI', 'Madison Heights, MI', 'Roseville, MI', 'St. Clair Shores, MI'],
            40 => ['Ann Arbor, MI', 'Ypsilanti, MI', 'Pontiac, MI', 'Auburn Hills, MI', 'Rochester Hills, MI', 'Shelby Township, MI', 'Macomb, MI', 'Clinton Township, MI', 'Taylor, MI', 'Romulus, MI', 'Inkster, MI', 'Garden City, MI', 'Dearborn Heights, MI', 'Flat Rock, MI', 'Trenton, MI', 'Grosse Pointe, MI'],
        ],
        'minneapolis,mn' => [
            10 => ['St. Paul, MN', 'Richfield, MN', 'Columbia Heights, MN'],
            15 => ['Edina, MN', 'St. Louis Park, MN', 'Golden Valley, MN', 'Robbinsdale, MN', 'Crystal, MN', 'New Hope, MN', 'Hopkins, MN', 'Minnetonka, MN', 'Bloomington, MN', 'Roseville, MN'],
            25 => ['Plymouth, MN', 'Maple Grove, MN', 'Brooklyn Park, MN', 'Brooklyn Center, MN', 'Fridley, MN', 'Coon Rapids, MN', 'Blaine, MN', 'Burnsville, MN', 'Eagan, MN', 'Apple Valley, MN', 'Lakeville, MN', 'Savage, MN', 'Prior Lake, MN', 'Eden Prairie, MN', 'Chanhassen, MN', 'Shakopee, MN'],
            40 => ['Woodbury, MN', 'Cottage Grove, MN', 'Stillwater, MN', 'Forest Lake, MN', 'Anoka, MN', 'Andover, MN', 'Ramsey, MN', 'Elk River, MN', 'Rogers, MN', 'Wayzata, MN', 'Excelsior, MN', 'Chaska, MN', 'Hastings, MN', 'Red Wing, MN', 'Northfield, MN', 'Faribault, MN'],
        ],
        'las vegas,nv' => [
            10 => ['North Las Vegas, NV', 'Paradise, NV', 'Spring Valley, NV'],
            15 => ['Henderson, NV', 'Summerlin, NV', 'Enterprise, NV', 'Whitney, NV', 'Sunrise Manor, NV', 'Winchester, NV'],
            25 => ['Green Valley, NV', 'Anthem, NV', 'Aliante, NV', 'Centennial Hills, NV', 'Mountains Edge, NV', 'Southern Highlands, NV', 'Skye Canyon, NV', 'Providence, NV', 'Inspirada, NV', 'Cadence, NV'],
            40 => ['Boulder City, NV', 'Mesquite, NV', 'Pahrump, NV', 'Primm, NV', 'Jean, NV', 'Laughlin, NV', 'Moapa Valley, NV', 'Indian Springs, NV', 'Nellis AFB, NV', 'Logandale, NV'],
        ],
    ];

    if (!isset($metroMap[$metroKey])) {
        return [];
    }

    $nearby = [];
    foreach ($metroMap[$metroKey] as $distance => $cities) {
        if ((int)$distance <= $radiusMiles) {
            $nearby = array_merge($nearby, $cities);
        }
    }

    $unique = [];
    foreach ($nearby as $cityName) {
        $cityName = preg_replace('/\s+/', ' ', trim((string)$cityName));
        if ($cityName !== '' && !in_array($cityName, $unique, true)) {
            $unique[] = $cityName;
        }
    }

    return $unique;
}

/**
 * Expand common service synonyms to increase query coverage.
 * Comprehensive synonym map for 25+ industries to maximize lead volume.
 */
function expandServiceSynonyms($service) {
    $clean = preg_replace('/\s+/', ' ', trim((string)$service));
    if ($clean === '') {
        return [];
    }

    $normalized = strtolower($clean);
    $variants = [$clean];
    $synonyms = [];

    // Comprehensive synonym map — each keyword triggers 20-35 related search terms for maximum lead volume
    $synonymMap = [
        // Auto / Mechanic
        '/\bmechanic\b|\bauto repair\b|\bcar repair\b|\bautomotive\b|\bauto shop\b/' => [
            'auto mechanic', 'automotive mechanic', 'car technician', 'automotive technician',
            'vehicle technician', 'service technician', 'master technician', 'auto repair technician',
            'engine technician', 'drivetrain specialist', 'diagnostic technician', 'diesel mechanic',
            'auto repair specialist', 'automotive service professional', 'certified mechanic',
            'auto repair shop', 'car repair shop', 'auto service center', 'vehicle repair',
            'transmission repair', 'brake repair shop', 'oil change service', 'tire shop',
            'muffler shop', 'exhaust repair', 'car maintenance', 'fleet mechanic',
            'hybrid car mechanic', 'electric vehicle technician', 'mobile mechanic',
            'roadside mechanic', 'ASE certified mechanic', 'foreign car specialist',
            'import car repair', 'domestic car repair', 'classic car mechanic',
        ],
        // Dental
        '/\bdental\b|\bdentist\b|\borthodont\b/' => [
            'dentist', 'dental clinic', 'dental office', 'family dentist', 'cosmetic dentist',
            'dental surgeon', 'orthodontist', 'endodontist', 'pediatric dentist',
            'dental practice', 'emergency dentist', 'dental care', 'oral surgeon',
            'dental hygienist', 'implant dentist', 'denture clinic', 'periodontist',
            'prosthodontist', 'teeth whitening', 'dental implants', 'invisalign provider',
            'braces specialist', 'root canal specialist', 'wisdom teeth removal',
            'sedation dentist', 'holistic dentist', 'geriatric dentist', 'smile makeover',
            'dental crown specialist', 'veneer specialist', 'TMJ dentist',
            'sleep apnea dentist', 'oral health clinic', 'dental x-ray',
        ],
        // Plumbing
        '/\bplumber\b|\bplumbing\b/' => [
            'plumbing company', 'plumbing contractor', 'drain specialist', 'pipe repair',
            'emergency plumber', 'residential plumber', 'commercial plumber', 'plumbing service',
            'sewer repair', 'water heater repair', 'leak detection', 'plumbing repair',
            'drain cleaning', 'pipe fitting', 'backflow prevention', 'gas line plumber',
            'water line repair', 'sewer line replacement', 'trenchless sewer repair',
            'toilet repair', 'faucet installation', 'garbage disposal repair',
            'sump pump installation', 'water softener installation', 'hydro jetting',
            'septic tank service', 'bathroom plumber', 'kitchen plumber',
            'water filtration installer', 'repiping specialist', 'master plumber',
            'licensed plumber', 'journeyman plumber', '24 hour plumber',
        ],
        // Legal / Lawyer
        '/\blawyer\b|\battorney\b|\blaw firm\b|\blegal\b/' => [
            'attorney', 'law firm', 'legal services', 'legal counsel', 'law office',
            'trial lawyer', 'litigation attorney', 'family lawyer', 'divorce attorney',
            'personal injury lawyer', 'criminal defense attorney', 'estate planning attorney',
            'business lawyer', 'immigration lawyer', 'bankruptcy attorney', 'real estate attorney',
            'employment lawyer', 'workers compensation attorney', 'medical malpractice lawyer',
            'tax attorney', 'intellectual property lawyer', 'patent attorney',
            'contract lawyer', 'civil rights attorney', 'environmental lawyer',
            'elder law attorney', 'probate lawyer', 'DUI attorney', 'traffic lawyer',
            'social security disability lawyer', 'slip and fall attorney',
            'wrongful death lawyer', 'class action attorney', 'corporate lawyer',
            'mergers and acquisitions attorney', 'securities lawyer',
        ],
        // HVAC
        '/\bhvac\b|\bair conditioning\b|\bheating\b|\bac repair\b|\bfurnace\b/' => [
            'hvac contractor', 'heating and cooling', 'ac repair', 'furnace repair',
            'air conditioning service', 'hvac technician', 'hvac company', 'duct cleaning',
            'heat pump repair', 'central air', 'hvac installation', 'cooling system repair',
            'thermostat installation', 'air quality specialist', 'hvac maintenance',
            'commercial hvac', 'residential hvac', 'mini split installation',
            'boiler repair', 'radiant heating', 'geothermal heating', 'hvac tune up',
            'refrigerant recharge', 'evaporator coil repair', 'condenser repair',
            'air handler service', 'ventilation specialist', 'indoor air quality',
            'humidifier installation', 'dehumidifier service', 'zone control system',
            'energy efficient hvac', 'smart thermostat installation', 'emergency hvac',
        ],
        // Roofing
        '/\broof\b|\broofing\b|\broofer\b/' => [
            'roofing contractor', 'roof repair', 'roofing company', 'roof replacement',
            'commercial roofing', 'residential roofer', 'roof inspection', 'shingle repair',
            'metal roofing', 'flat roof repair', 'storm damage repair', 'gutter installation',
            'roof leak repair', 'roofing specialist', 'tile roofing', 'slate roofing',
            'cedar shake roofing', 'TPO roofing', 'EPDM roofing', 'modified bitumen roofing',
            'roof coating', 'skylight installation', 'chimney repair', 'fascia repair',
            'soffit repair', 'roof ventilation', 'ice dam removal', 'emergency roof repair',
            'roof maintenance', 'green roofing', 'solar roofing', 'standing seam metal roof',
            'gutter guard installation', 'downspout repair', 'roof flashing repair',
        ],
        // Electrician
        '/\belectrician\b|\belectrical\b/' => [
            'electrical contractor', 'electrician', 'electrical repair', 'wiring specialist',
            'commercial electrician', 'residential electrician', 'emergency electrician',
            'electrical service', 'panel upgrade', 'lighting installation', 'electrical company',
            'master electrician', 'journeyman electrician', 'licensed electrician',
            'circuit breaker repair', 'outlet installation', 'ceiling fan installation',
            'generator installation', 'whole house surge protector', 'EV charger installation',
            'knob and tube rewiring', 'aluminum wiring replacement', 'landscape lighting',
            'recessed lighting', 'electrical inspection', 'code compliance electrician',
            'industrial electrician', 'low voltage electrician', 'home automation wiring',
            'smart home electrician', 'solar panel electrician', 'electrical troubleshooting',
        ],
        // Real Estate
        '/\brealtor\b|\breal estate\b|\brealty\b/' => [
            'real estate agent', 'realtor', 'real estate broker', 'property agent',
            'real estate company', 'home sales agent', 'listing agent', 'buyer agent',
            'commercial real estate', 'real estate office', 'property management',
            'real estate investor', 'real estate appraiser', 'property valuation',
            'luxury real estate', 'foreclosure specialist', 'short sale agent',
            'first time home buyer agent', 'relocation specialist', 'land broker',
            'condo specialist', 'townhouse agent', 'vacation property agent',
            'rental property manager', 'real estate consultant', 'home staging',
            'real estate photographer', 'open house agent', 'MLS listing agent',
            'investment property agent', 'multi-family real estate', 'new construction realtor',
        ],
        // Restaurant / Food
        '/\brestaurant\b|\bdining\b|\bcafe\b|\beatery\b|\bcater\b/' => [
            'restaurant', 'dining', 'cafe', 'bistro', 'eatery', 'diner',
            'food service', 'catering', 'bar and grill', 'pizzeria', 'steakhouse',
            'food truck', 'fast food', 'family restaurant', 'fine dining',
            'sports bar', 'pub', 'tavern', 'brasserie', 'trattoria',
            'sushi restaurant', 'seafood restaurant', 'Mexican restaurant',
            'Chinese restaurant', 'Indian restaurant', 'Thai restaurant',
            'Italian restaurant', 'Mediterranean restaurant', 'vegan restaurant',
            'vegetarian restaurant', 'farm to table', 'brunch spot',
            'breakfast restaurant', 'buffet restaurant', 'catering company',
        ],
        // Medical / Doctor
        '/\bdoctor\b|\bphysician\b|\bmedical\b|\bclinic\b|\bhealthcare\b/' => [
            'doctor', 'physician', 'medical clinic', 'healthcare provider', 'family doctor',
            'general practitioner', 'internal medicine', 'urgent care', 'medical center',
            'primary care physician', 'walk-in clinic', 'health clinic',
            'concierge doctor', 'telemedicine doctor', 'holistic medicine', 'functional medicine',
            'integrative medicine', 'direct primary care', 'preventive medicine',
            'sports medicine doctor', 'geriatric doctor', 'pediatrician',
            'cardiologist', 'dermatologist', 'gastroenterologist', 'neurologist',
            'pulmonologist', 'rheumatologist', 'allergist', 'endocrinologist',
            'nephrologist', 'infectious disease doctor', 'pain management doctor',
            'sleep medicine doctor', 'weight loss doctor', 'anti-aging doctor',
        ],
        // Therapy / Counseling
        '/\btherap\b|\bcounsel\b|\bpsycholog\b|\bmental health\b/' => [
            'therapist', 'counselor', 'psychologist', 'mental health counselor',
            'marriage counselor', 'family therapist', 'behavioral therapist',
            'cognitive behavioral therapy', 'psychotherapist', 'licensed therapist',
            'anxiety therapist', 'depression counselor', 'trauma therapist',
            'substance abuse counselor', 'addiction therapist', 'grief counselor',
            'EMDR therapist', 'DBT therapist', 'play therapist', 'art therapist',
            'music therapist', 'anger management counselor', 'life coach',
            'couples therapist', 'group therapy', 'teletherapy provider',
            'clinical social worker', 'psychiatric nurse practitioner',
            'child psychologist', 'adolescent therapist', 'eating disorder therapist',
        ],
        // Physical Therapy
        '/\bphysical therap\b|\brehab\b|\bpt clinic\b/' => [
            'physical therapist', 'physical therapy clinic', 'rehabilitation center',
            'sports physical therapy', 'occupational therapist', 'orthopedic rehab',
            'post surgery rehabilitation', 'pelvic floor therapy', 'aquatic therapy',
            'hand therapy', 'vestibular therapy', 'geriatric physical therapy',
            'pediatric physical therapy', 'neurological rehabilitation', 'cardiac rehab',
            'pulmonary rehabilitation', 'work injury rehab', 'pain rehabilitation',
            'balance therapy', 'gait training', 'functional capacity evaluation',
            'dry needling therapy', 'cupping therapy', 'kinesiology',
            'movement specialist', 'mobility specialist', 'strength rehab',
        ],
        // Massage
        '/\bmassage\b/' => [
            'massage therapist', 'massage therapy', 'sports massage', 'deep tissue massage',
            'Swedish massage', 'therapeutic massage', 'prenatal massage', 'hot stone massage',
            'myofascial release', 'trigger point therapy', 'lymphatic drainage massage',
            'aromatherapy massage', 'reflexology', 'craniosacral therapy',
            'shiatsu massage', 'Thai massage', 'couples massage', 'chair massage',
            'medical massage', 'oncology massage', 'geriatric massage',
            'neuromuscular massage', 'cupping massage', 'ashiatsu massage',
            'lomi lomi massage', 'mobile massage therapist', 'corporate massage',
        ],
        // Optometry / Eye Care
        '/\boptometr\b|\beye doctor\b|\beye care\b|\bophthalmolog\b/' => [
            'optometrist', 'eye doctor', 'eye care center', 'ophthalmologist',
            'vision center', 'optical shop', 'lasik surgeon', 'pediatric eye doctor',
            'contact lens specialist', 'eye exam', 'vision therapy',
            'retina specialist', 'glaucoma specialist', 'cataract surgeon',
            'cornea specialist', 'neuro-ophthalmologist', 'oculoplastic surgeon',
            'low vision specialist', 'sports vision specialist', 'eyeglass store',
            'prescription sunglasses', 'emergency eye care', 'dry eye specialist',
            'macular degeneration doctor', 'diabetic eye care', 'eye allergist',
        ],
        // Landscaping
        '/\blandscap\b|\blawn\b|\bgarden\b/' => [
            'landscaping company', 'lawn care', 'lawn service', 'landscape design',
            'landscaper', 'lawn maintenance', 'garden service', 'tree service',
            'yard maintenance', 'hardscaping', 'irrigation service', 'outdoor living',
            'tree trimming', 'tree removal', 'stump grinding', 'bush trimming',
            'hedge trimming', 'mulching service', 'sod installation', 'lawn aeration',
            'fertilization service', 'weed control', 'landscape lighting',
            'patio installation', 'retaining wall builder', 'water feature installation',
            'xeriscaping', 'native plant landscaping', 'commercial landscaping',
            'snow removal service', 'leaf removal', 'lawn mowing service',
        ],
        // Insurance
        '/\binsurance\b/' => [
            'insurance agent', 'insurance broker', 'insurance company', 'insurance agency',
            'auto insurance', 'home insurance', 'life insurance', 'health insurance',
            'commercial insurance', 'insurance provider', 'renters insurance',
            'flood insurance', 'earthquake insurance', 'umbrella insurance',
            'business insurance', 'workers compensation insurance', 'liability insurance',
            'professional liability insurance', 'cyber insurance', 'pet insurance',
            'dental insurance', 'vision insurance', 'disability insurance',
            'long term care insurance', 'boat insurance', 'motorcycle insurance',
            'RV insurance', 'landlord insurance', 'event insurance',
        ],
        // Accounting / CPA
        '/\baccountant\b|\bcpa\b|\baccounting\b|\bbookkeep\b|\btax prep\b/' => [
            'accountant', 'cpa', 'certified public accountant', 'bookkeeper',
            'tax preparation', 'accounting firm', 'tax accountant', 'payroll services',
            'financial advisor', 'tax consultant', 'accounting services',
            'forensic accountant', 'audit services', 'tax planning', 'estate tax accountant',
            'business tax preparation', 'nonprofit accountant', 'QuickBooks specialist',
            'CFO services', 'controller services', 'cost accountant',
            'management accountant', 'enrolled agent', 'tax resolution specialist',
            'IRS representation', 'sales tax consultant', 'financial planner',
            'wealth management advisor', 'retirement planning', 'small business accountant',
        ],
        // Construction
        '/\bconstruction\b|\bcontractor\b|\bbuilder\b|\bgeneral contractor\b/' => [
            'construction company', 'general contractor', 'home builder', 'building contractor',
            'remodeling contractor', 'renovation contractor', 'commercial construction',
            'residential construction', 'home improvement contractor',
            'kitchen remodeling', 'bathroom remodeling', 'basement finishing',
            'room addition contractor', 'deck builder', 'fence contractor',
            'concrete contractor', 'foundation repair', 'demolition contractor',
            'framing contractor', 'drywall contractor', 'flooring contractor',
            'tile installer', 'cabinet maker', 'countertop installer',
            'siding contractor', 'window installer', 'door installer',
            'custom home builder', 'green building contractor', 'design build contractor',
        ],
        // Cleaning
        '/\bcleaning\b|\bcleaner\b|\bjanitorial\b|\bmaid\b/' => [
            'cleaning service', 'house cleaning', 'commercial cleaning', 'janitorial service',
            'maid service', 'carpet cleaning', 'office cleaning', 'deep cleaning',
            'window cleaning', 'pressure washing', 'move out cleaning',
            'move in cleaning', 'post construction cleaning', 'tile and grout cleaning',
            'upholstery cleaning', 'air duct cleaning', 'hoarder cleaning',
            'biohazard cleaning', 'crime scene cleaning', 'industrial cleaning',
            'green cleaning service', 'recurring cleaning', 'one time cleaning',
            'spring cleaning service', 'vacation rental cleaning', 'Airbnb cleaning',
            'restaurant cleaning', 'medical office cleaning', 'school cleaning',
        ],
        // Photography
        '/\bphotograph\b/' => [
            'photographer', 'photography studio', 'wedding photographer', 'portrait photographer',
            'commercial photographer', 'event photographer', 'photo studio',
            'family photographer', 'newborn photographer', 'maternity photographer',
            'senior portrait photographer', 'headshot photographer', 'product photographer',
            'food photographer', 'real estate photographer', 'drone photographer',
            'sports photographer', 'fashion photographer', 'boudoir photographer',
            'pet photographer', 'school photographer', 'corporate photographer',
            'architectural photographer', 'landscape photographer', 'photojournalist',
        ],
        // Fitness / Gym
        '/\bgym\b|\bfitness\b|\bpersonal train\b|\bworkout\b/' => [
            'gym', 'fitness center', 'personal trainer', 'health club', 'CrossFit',
            'yoga studio', 'pilates studio', 'fitness studio', 'workout gym',
            'boxing gym', 'martial arts studio', 'kickboxing gym', 'spin studio',
            'barre studio', 'boot camp fitness', 'strength training gym',
            'powerlifting gym', 'Olympic lifting gym', 'functional fitness',
            'group fitness', 'HIIT studio', 'aqua fitness', 'senior fitness',
            'prenatal fitness', 'weight loss program', 'body transformation',
            'nutrition coach', 'online personal trainer', 'sports performance trainer',
            'certified fitness instructor', '24 hour gym', 'boutique gym',
        ],
        // Veterinary
        '/\bvet\b|\bveterinar\b|\banimal\b|\bpet\b/' => [
            'veterinarian', 'vet clinic', 'animal hospital', 'pet clinic',
            'veterinary hospital', 'emergency vet', 'animal care', 'pet hospital',
            'mobile vet', 'holistic veterinarian', 'exotic animal vet',
            'avian veterinarian', 'equine veterinarian', 'feline veterinarian',
            'canine specialist', 'veterinary surgeon', 'veterinary dentist',
            'veterinary dermatologist', 'veterinary ophthalmologist', 'pet wellness clinic',
            'low cost vet clinic', 'spay and neuter clinic', 'pet vaccination clinic',
            'veterinary oncologist', 'veterinary cardiologist', 'animal rescue',
            'pet grooming', 'dog groomer', 'pet boarding', 'doggy daycare',
        ],
        // Moving
        '/\bmoving\b|\bmover\b|\brelocation\b/' => [
            'moving company', 'movers', 'relocation service', 'local movers',
            'long distance movers', 'packing service', 'moving and storage',
            'commercial movers', 'office movers', 'piano movers', 'furniture movers',
            'senior moving service', 'military movers', 'international movers',
            'apartment movers', 'house movers', 'flat rate movers', 'hourly movers',
            'full service movers', 'loading and unloading', 'moving labor',
            'pod moving', 'container moving', 'auto transport', 'vehicle shipping',
            'junk removal', 'estate cleanout', 'storage unit movers',
        ],
        // Pest Control
        '/\bpest\b|\bexterminator\b|\bbug\b|\btermite\b/' => [
            'pest control', 'exterminator', 'termite control', 'pest management',
            'rodent control', 'bed bug treatment', 'wildlife removal',
            'ant exterminator', 'cockroach control', 'mosquito control',
            'flea treatment', 'spider control', 'wasp removal', 'bee removal',
            'moth control', 'silverfish treatment', 'cricket control',
            'commercial pest control', 'residential pest control', 'organic pest control',
            'green pest control', 'integrated pest management', 'fumigation service',
            'crawl space pest control', 'attic pest removal', 'lawn pest control',
            'tick control', 'fly control', 'bird control',
        ],
        // Marketing / Digital Agency
        '/\bmarketing\b|\bseo\b|\bdigital agency\b|\badvertising\b/' => [
            'marketing agency', 'digital marketing', 'seo company', 'advertising agency',
            'social media marketing', 'ppc agency', 'content marketing', 'web marketing',
            'branding agency', 'online marketing', 'digital agency',
            'email marketing agency', 'video marketing', 'influencer marketing',
            'affiliate marketing', 'marketing consultant', 'growth marketing',
            'performance marketing', 'local seo', 'national seo', 'ecommerce seo',
            'google ads management', 'facebook ads agency', 'tiktok marketing',
            'linkedin marketing', 'PR agency', 'public relations firm',
            'reputation management', 'conversion rate optimization', 'marketing automation',
        ],
        // Web Design
        '/\bweb design\b|\bweb develop\b|\bwebsite\b/' => [
            'web design company', 'web developer', 'website designer', 'web development agency',
            'website development', 'web agency', 'website builder', 'frontend developer',
            'UI UX designer', 'responsive web design', 'ecommerce website developer',
            'WordPress developer', 'Shopify developer', 'Wix designer',
            'Squarespace developer', 'custom web application', 'landing page designer',
            'mobile app developer', 'fullstack developer', 'web hosting provider',
            'website maintenance', 'website redesign', 'ADA compliant web design',
            'SEO web design', 'graphic designer', 'logo designer',
        ],
        // Salon / Beauty
        '/\bsalon\b|\bbeauty\b|\bhair\b|\bnail\b|\bbarber\b/' => [
            'hair salon', 'beauty salon', 'barber shop', 'nail salon', 'spa',
            'hair stylist', 'beauty parlor', 'day spa', 'beauty studio',
            'hair colorist', 'balayage specialist', 'keratin treatment',
            'hair extension specialist', 'braiding salon', 'natural hair salon',
            'mens grooming', 'beard trim', 'hot shave barber', 'kids hair salon',
            'blowout bar', 'lash salon', 'eyelash extensions', 'microblading',
            'waxing salon', 'threading salon', 'tanning salon', 'spray tan',
            'med spa', 'facial treatment', 'chemical peel', 'Botox provider',
        ],
        // Towing
        '/\btow\b|\btowing\b/' => [
            'towing service', 'tow truck', 'roadside assistance', 'emergency towing',
            'auto towing', 'flatbed towing', 'vehicle recovery',
            'motorcycle towing', 'heavy duty towing', 'semi truck towing',
            'RV towing', 'long distance towing', 'accident towing',
            'lockout service', 'jump start service', 'tire change service',
            'fuel delivery service', 'winch out service', 'off road recovery',
            'impound towing', 'private property towing', 'abandoned vehicle removal',
            'junk car towing', 'scrap car removal', '24 hour towing',
        ],
        // Painting
        '/\bpainter\b|\bpainting\b/' => [
            'painting contractor', 'house painter', 'commercial painter', 'painting company',
            'interior painting', 'exterior painting', 'residential painter',
            'cabinet painting', 'deck staining', 'fence staining', 'pressure washing painter',
            'wallpaper installer', 'wallpaper removal', 'epoxy floor coating',
            'garage floor painting', 'industrial painter', 'mural painter',
            'faux finish painter', 'texture specialist', 'drywall repair painter',
            'popcorn ceiling removal', 'trim painter', 'spray painter',
            'lead paint removal', 'eco-friendly painter', 'color consultant',
        ],
        // Chiropractor / Spinal Care
        '/\bchiropract\b|\bspinal\b|\bback doctor\b|\bspine specialist\b/' => [
            'chiropractor', 'chiropractic clinic', 'chiropractic care', 'spine specialist',
            'chiropractic office', 'back pain doctor', 'spinal specialist', 'spinal care provider',
            'musculoskeletal therapist', 'manual therapist', 'orthopedic specialist',
            'neck and back specialist', 'physical medicine doctor', 'sports chiropractor',
            'pediatric chiropractor', 'chiropractic wellness center', 'spinal decompression',
            'chiropractic adjustment', 'holistic chiropractor', 'integrative chiropractor',
            'chiropractic rehabilitation', 'posture correction specialist', 'sciatica treatment',
            'herniated disc treatment', 'whiplash treatment', 'spinal alignment',
            'neuromuscular therapy', 'soft tissue therapy', 'spinal manipulation',
            'pain management clinic', 'back pain relief', 'neck pain treatment',
            'sports injury chiropractor', 'prenatal chiropractor', 'family chiropractor',
        ],
        // Pharmacy
        '/\bpharmac\b/' => [
            'pharmacy', 'drugstore', 'compounding pharmacy', 'retail pharmacy',
            'specialty pharmacy', 'independent pharmacy', 'community pharmacy',
            'mail order pharmacy', 'hospital pharmacy', 'clinical pharmacy',
            'veterinary pharmacy', 'nuclear pharmacy', 'infusion pharmacy',
            'long term care pharmacy', 'consultant pharmacist', '24 hour pharmacy',
            'drive through pharmacy', 'medication management', 'prescription delivery',
            'immunization pharmacy', 'diabetes pharmacy', 'durable medical equipment',
        ],
        // Auto Body
        '/\bauto body\b|\bcollision\b|\bbody shop\b/' => [
            'auto body shop', 'collision repair', 'body shop', 'paint and body',
            'dent repair', 'auto body repair', 'collision center',
            'paintless dent repair', 'bumper repair', 'scratch repair',
            'auto painting', 'custom paint job', 'frame repair',
            'hail damage repair', 'fender repair', 'door ding repair',
            'fiberglass repair', 'auto glass repair', 'windshield replacement',
            'headlight restoration', 'auto detailing', 'ceramic coating',
            'paint protection film', 'vinyl wrap', 'custom body kit',
        ],
        // Tutoring / Education
        '/\btutor\b|\btutoring\b|\beducat\b|\blearn\b|\bteach\b/' => [
            'tutor', 'tutoring service', 'math tutor', 'reading tutor',
            'science tutor', 'English tutor', 'SAT prep tutor', 'ACT prep',
            'college prep', 'test prep', 'homework help', 'after school tutoring',
            'online tutor', 'in home tutor', 'learning center', 'Kumon',
            'Sylvan learning', 'Mathnasium', 'STEM tutor', 'coding tutor',
            'music teacher', 'piano teacher', 'guitar teacher', 'private lessons',
            'language tutor', 'Spanish tutor', 'ESL teacher', 'GED prep',
        ],
        // Daycare / Childcare
        '/\bdaycare\b|\bchildcare\b|\bchild care\b|\bpreschool\b|\bnursery\b/' => [
            'daycare center', 'childcare provider', 'preschool', 'nursery school',
            'early childhood education', 'Montessori school', 'in home daycare',
            'infant care', 'toddler care', 'after school care', 'before school care',
            'summer camp', 'nanny service', 'au pair', 'babysitter',
            'licensed daycare', 'church daycare', 'corporate childcare',
            'drop in childcare', 'special needs daycare', 'bilingual preschool',
            'nature preschool', 'cooperative preschool', 'Head Start program',
        ],
        // Florist / Flowers
        '/\bflorist\b|\bflower\b|\bfloral\b/' => [
            'florist', 'flower shop', 'floral designer', 'wedding florist',
            'event florist', 'funeral flowers', 'sympathy flowers', 'flower delivery',
            'same day flower delivery', 'bouquet shop', 'plant nursery',
            'garden center', 'indoor plants', 'succulent shop', 'dried flower shop',
            'flower subscription', 'corporate flower service', 'tropical flowers',
            'custom floral arrangements', 'balloon and flower shop',
        ],
        // IT Services / Computer Repair
        '/\bit service\b|\bcomputer repair\b|\btech support\b|\bit support\b|\bmanaged it\b/' => [
            'IT services', 'computer repair', 'tech support', 'IT support',
            'managed IT', 'IT consulting', 'network setup', 'server support',
            'cybersecurity company', 'data recovery', 'virus removal',
            'laptop repair', 'PC repair', 'Mac repair', 'phone repair',
            'screen repair', 'IT outsourcing', 'cloud computing services',
            'backup solutions', 'VoIP provider', 'cabling contractor',
            'IT security', 'managed service provider', 'help desk services',
            'remote IT support', 'computer networking', 'WiFi installation',
        ],
        // Locksmith
        '/\blocksmith\b|\block\b|\bkey\b/' => [
            'locksmith', 'emergency locksmith', 'automotive locksmith',
            'residential locksmith', 'commercial locksmith', '24 hour locksmith',
            'car lockout service', 'lock change', 'lock rekey', 'key duplication',
            'master key system', 'access control', 'safe locksmith',
            'lock installation', 'smart lock installer', 'deadbolt installation',
            'keyless entry installer', 'lock repair', 'padlock specialist',
        ],
        // Garage Door
        '/\bgarage door\b|\boverhead door\b/' => [
            'garage door repair', 'garage door installation', 'garage door company',
            'overhead door', 'garage door opener repair', 'garage door spring repair',
            'garage door cable repair', 'garage door panel replacement',
            'commercial garage door', 'rolling steel door', 'automatic garage door',
            'insulated garage door', 'custom garage door', 'garage door maintenance',
            'emergency garage door repair', 'garage door remote programming',
        ],
        // Appliance Repair
        '/\bappliance\b/' => [
            'appliance repair', 'washer repair', 'dryer repair', 'refrigerator repair',
            'dishwasher repair', 'oven repair', 'stove repair', 'microwave repair',
            'ice maker repair', 'garbage disposal repair', 'range repair',
            'freezer repair', 'wine cooler repair', 'commercial appliance repair',
            'small appliance repair', 'appliance installation', 'appliance maintenance',
        ],
        // Flooring
        '/\bfloor\b|\bflooring\b|\bcarpet install\b/' => [
            'flooring company', 'flooring contractor', 'hardwood flooring',
            'laminate flooring', 'vinyl flooring', 'tile flooring', 'carpet installation',
            'engineered hardwood', 'bamboo flooring', 'cork flooring',
            'epoxy flooring', 'concrete polishing', 'floor refinishing',
            'floor sanding', 'floor staining', 'waterproof flooring',
            'luxury vinyl plank', 'commercial flooring', 'residential flooring',
            'floor repair', 'subfloor repair', 'heated flooring installation',
        ],
        // Pool / Swimming Pool
        '/\bpool\b|\bswimming pool\b|\bhot tub\b|\bspa service\b/' => [
            'pool service', 'pool cleaning', 'pool repair', 'pool company',
            'swimming pool contractor', 'pool builder', 'pool installation',
            'pool maintenance', 'pool resurfacing', 'pool remodeling',
            'pool heater repair', 'pool pump repair', 'pool filter service',
            'pool tile repair', 'pool deck resurfacing', 'pool safety fence',
            'hot tub service', 'spa repair', 'pool opening service',
            'pool closing service', 'pool leak detection', 'saltwater pool conversion',
        ],
        // Funeral / Mortuary
        '/\bfuneral\b|\bmortuary\b|\bcremat\b/' => [
            'funeral home', 'mortuary', 'funeral director', 'cremation service',
            'funeral service', 'memorial service', 'burial service', 'cemetery',
            'funeral chapel', 'celebration of life', 'pre-need funeral planning',
            'direct cremation', 'green burial', 'pet cremation', 'obituary service',
            'funeral catering', 'grief support', 'estate executor assistance',
        ],
        // Tattoo / Piercing
        '/\btattoo\b|\bpiercing\b|\bbody art\b/' => [
            'tattoo shop', 'tattoo artist', 'tattoo parlor', 'tattoo studio',
            'piercing studio', 'body piercing', 'custom tattoo', 'cover up tattoo',
            'tattoo removal', 'laser tattoo removal', 'permanent makeup',
            'cosmetic tattoo', 'microblading', 'scalp micropigmentation',
            'henna artist', 'body art studio', 'traditional tattoo',
            'fine line tattoo', 'watercolor tattoo', 'realism tattoo artist',
        ],
        // Printing / Signs
        '/\bprint\b|\bsign\b|\bbanner\b|\bgraphic\b/' => [
            'printing company', 'sign shop', 'sign company', 'banner printing',
            'custom signs', 'vehicle wrap', 'car wrap', 'vinyl lettering',
            'business cards printing', 'flyer printing', 'brochure printing',
            'large format printing', 'screen printing', 'embroidery shop',
            't-shirt printing', 'promotional products', 'trade show displays',
            'neon signs', 'LED signs', 'monument signs', 'channel letters',
            'A-frame signs', 'yard signs', 'real estate signs', 'window graphics',
        ],
        // Security
        '/\bsecurity\b|\balarm\b|\bsurveillance\b/' => [
            'security company', 'alarm system', 'surveillance cameras',
            'home security', 'commercial security', 'security guard service',
            'CCTV installation', 'access control system', 'fire alarm system',
            'security monitoring', 'video surveillance', 'smart home security',
            'intercom system', 'security patrol', 'private investigator',
            'bodyguard service', 'event security', 'security consultant',
            'burglar alarm', 'motion sensor installation', 'doorbell camera',
        ],
        // Welding / Metal Work
        '/\bweld\b|\bmetal work\b|\bfabricat\b|\biron work\b/' => [
            'welding service', 'welder', 'metal fabrication', 'custom welding',
            'structural welding', 'pipe welding', 'aluminum welding', 'TIG welding',
            'MIG welding', 'stick welding', 'mobile welding', 'ornamental iron',
            'wrought iron', 'custom metal work', 'steel fabrication',
            'handrail fabrication', 'gate fabrication', 'metal staircase',
            'industrial welding', 'underwater welding', 'certified welder',
        ],
        // Storage
        '/\bstorage\b|\bself storage\b|\bwarehouse\b/' => [
            'self storage', 'storage unit', 'mini storage', 'climate controlled storage',
            'vehicle storage', 'boat storage', 'RV storage', 'warehouse storage',
            'portable storage', 'storage container', 'document storage',
            'wine storage', 'business storage', 'student storage',
            'military storage', 'moving storage', 'long term storage',
        ],
        // Dry Cleaning / Laundry
        '/\bdry clean\b|\blaundry\b|\blaundromat\b/' => [
            'dry cleaner', 'dry cleaning', 'laundry service', 'laundromat',
            'wash and fold', 'coin laundry', 'commercial laundry',
            'wedding dress cleaning', 'suit cleaning', 'leather cleaning',
            'alterations', 'tailor', 'seamstress', 'garment repair',
            'pickup and delivery laundry', 'same day dry cleaning',
            'eco friendly dry cleaner', 'organic dry cleaning',
        ],
    ];

    foreach ($synonymMap as $pattern => $terms) {
        if (preg_match($pattern, $normalized)) {
            $synonyms = array_merge($synonyms, $terms);
        }
    }

    // If no specific match, add generic business-type variants
    if (empty($synonyms)) {
        $synonyms[] = "$clean service";
        $synonyms[] = "$clean company";
        $synonyms[] = "$clean provider";
        $synonyms[] = "$clean specialist";
        $synonyms[] = "$clean contractor";
        $synonyms[] = "$clean consultant";
        $synonyms[] = "$clean agency";
        $synonyms[] = "$clean firm";
        $synonyms[] = "$clean solutions";
    }

    // UNIVERSAL INTENT MODIFIERS — these mirror how real customers search
    // and surface different Google result sets per modifier
    $intentModifiers = [
        // Proximity & local intent
        "$clean near me",
        "local $clean",
        "$clean in my area",
        "$clean nearby",
        // Quality & trust signals
        "best $clean",
        "top rated $clean",
        "top $clean",
        "leading $clean",
        "trusted $clean",
        "reliable $clean",
        "experienced $clean",
        // Credentials
        "licensed $clean",
        "certified $clean",
        "insured $clean",
        "accredited $clean",
        // Pricing intent
        "affordable $clean",
        "cheap $clean",
        "$clean free estimate",
        "$clean quote",
        "$clean pricing",
        "$clean cost",
        // Urgency intent
        "emergency $clean",
        "24 hour $clean",
        "same day $clean",
        "fast $clean",
        "$clean available now",
        "$clean open now",
        // Business type modifiers
        "professional $clean",
        "commercial $clean",
        "residential $clean",
        "family owned $clean",
        "small business $clean",
        // Service type modifiers
        "$clean installation",
        "$clean repair",
        "$clean maintenance",
        "$clean custom",
        // Review intent
        "$clean reviews",
    ];

    // Shuffle intent modifiers so different searches get different combos
    shuffle($intentModifiers);
    $synonyms = array_merge($synonyms, $intentModifiers);

    // Always add free directory source queries for maximum coverage
    $directorySynonyms = [
        // Major review/listing platforms
        "$clean site:yelp.com",
        "$clean site:bbb.org",
        "$clean site:yellowpages.com",
        "$clean site:manta.com",
        "$clean site:angi.com",
        "$clean site:thumbtack.com",
        "$clean site:homeadvisor.com",
        // Map & location directories
        "$clean site:mapquest.com",
        "$clean site:foursquare.com",
        "$clean site:apple.com/maps",
        "$clean site:bing.com/maps",
        // Classic directories
        "$clean site:superpages.com",
        "$clean site:citysearch.com",
        "$clean site:whitepages.com",
        "$clean site:dexknows.com",
        "$clean site:local.com",
        // Business-focused directories
        "$clean site:chamberofcommerce.com",
        "$clean site:merchantcircle.com",
        "$clean site:brownbook.net",
        "$clean site:hotfrog.com",
        "$clean site:spoke.com",
        "$clean site:buzzfile.com",
        "$clean site:dandb.com",
        "$clean site:dnb.com",
        // Industry & service directories
        "$clean site:bark.com",
        "$clean site:expertise.com",
        "$clean site:thervo.com",
        "$clean site:porch.com",
        "$clean site:networx.com",
        "$clean site:houzz.com",
        "$clean site:buildzoom.com",
        // Search USA & aggregators
        "$clean site:searchusa.com",
        "$clean site:uscity.net",
        "$clean site:americantowns.com",
        "$clean site:showmelocal.com",
        "$clean site:localstack.com",
        "$clean site:cylex-usa.com",
        "$clean site:us-info.com",
        // Health-specific (if applicable)
        "$clean site:healthgrades.com",
        "$clean site:zocdoc.com",
        "$clean site:vitals.com",
        "$clean site:webmd.com/physician-directory",
        "$clean site:wellness.com",
        // Legal-specific
        "$clean site:avvo.com",
        "$clean site:justia.com",
        "$clean site:findlaw.com",
        "$clean site:lawyers.com",
        // Real estate specific
        "$clean site:zillow.com",
        "$clean site:realtor.com",
        "$clean site:trulia.com",
        // Food & restaurant specific
        "$clean site:tripadvisor.com",
        "$clean site:opentable.com",
        "$clean site:grubhub.com",
        "$clean site:doordash.com",
    ];
    $synonyms = array_merge($synonyms, $directorySynonyms);

    foreach ($synonyms as $synonym) {
        $synonym = preg_replace('/\s+/', ' ', trim($synonym));
        if ($synonym !== '') {
            $variants[] = $synonym;
        }
    }

    $unique = [];
    foreach ($variants as $variant) {
        $key = strtolower($variant);
        if (!isset($unique[$key])) {
            $unique[$key] = $variant;
        }
    }

    return array_values($unique);
}

/**
 * Return major city shards for a US state to improve broad-location coverage.
 */
function getStateCityShards($stateInput) {
    $normalized = strtolower(trim((string)$stateInput));
    if ($normalized === '') {
        return [];
    }
    $normalized = preg_replace('/\s+/', ' ', $normalized);
    $normalized = trim($normalized, " ,.");

    $aliases = [
        'tx' => 'texas',
        'ca' => 'california',
        'fl' => 'florida',
        'ny' => 'new york',
        'il' => 'illinois',
        'pa' => 'pennsylvania',
        'ga' => 'georgia',
        'nc' => 'north carolina',
        'oh' => 'ohio',
        'mi' => 'michigan',
        'va' => 'virginia',
        'wa' => 'washington',
        'az' => 'arizona',
        'tn' => 'tennessee',
        'co' => 'colorado',
        'mo' => 'missouri',
        'md' => 'maryland',
        'mn' => 'minnesota',
        'wi' => 'wisconsin',
        'ma' => 'massachusetts',
        'in' => 'indiana',
        'or' => 'oregon',
        'sc' => 'south carolina',
        'al' => 'alabama',
        'la' => 'louisiana',
        'ky' => 'kentucky',
        'ok' => 'oklahoma',
        'ct' => 'connecticut',
        'ut' => 'utah',
        'ia' => 'iowa',
        'nv' => 'nevada',
        'ar' => 'arkansas',
        'ks' => 'kansas',
        'ms' => 'mississippi',
        'nm' => 'new mexico',
        'ne' => 'nebraska',
        'id' => 'idaho',
        'wv' => 'west virginia',
        'hi' => 'hawaii',
        'nh' => 'new hampshire',
        'me' => 'maine',
        'ri' => 'rhode island',
        'mt' => 'montana',
        'de' => 'delaware',
        'sd' => 'south dakota',
        'nd' => 'north dakota',
        'ak' => 'alaska',
        'dc' => 'district of columbia',
        'nj' => 'new jersey',
        'vt' => 'vermont',
        'wy' => 'wyoming',
    ];
    if (isset($aliases[$normalized])) {
        $normalized = $aliases[$normalized];
    }

    $stateCities = [
        // High-impact states first.
        'texas' => ['Houston, TX', 'Dallas, TX', 'San Antonio, TX', 'Austin, TX', 'Fort Worth, TX', 'El Paso, TX', 'Arlington, TX', 'Plano, TX', 'Corpus Christi, TX', 'Lubbock, TX', 'Laredo, TX', 'Irving, TX', 'Garland, TX', 'Frisco, TX', 'McKinney, TX', 'Amarillo, TX', 'Waco, TX', 'Brownsville, TX', 'Pasadena, TX', 'Mesquite, TX'],
        'california' => ['Los Angeles, CA', 'San Diego, CA', 'San Jose, CA', 'San Francisco, CA', 'Fresno, CA', 'Sacramento, CA', 'Long Beach, CA', 'Oakland, CA', 'Bakersfield, CA', 'Anaheim, CA'],
        'florida' => ['Jacksonville, FL', 'Miami, FL', 'Tampa, FL', 'Orlando, FL', 'St. Petersburg, FL', 'Hialeah, FL', 'Tallahassee, FL', 'Fort Lauderdale, FL'],
        'new york' => ['New York, NY', 'Buffalo, NY', 'Rochester, NY', 'Yonkers, NY', 'Syracuse, NY', 'Albany, NY'],
        'illinois' => ['Chicago, IL', 'Aurora, IL', 'Naperville, IL', 'Joliet, IL', 'Rockford, IL', 'Springfield, IL'],
        'pennsylvania' => ['Philadelphia, PA', 'Pittsburgh, PA', 'Allentown, PA', 'Erie, PA', 'Reading, PA'],
        'georgia' => ['Atlanta, GA', 'Augusta, GA', 'Columbus, GA', 'Macon, GA', 'Savannah, GA'],
        'north carolina' => ['Charlotte, NC', 'Raleigh, NC', 'Greensboro, NC', 'Durham, NC', 'Winston-Salem, NC'],
    ];

    if (!isset($stateCities[$normalized])) {
        return [];
    }

    return $stateCities[$normalized];
}

/**
 * Build a stable dedupe key for a business result.
 */
function buildBusinessDedupeKey($business, $context = '') {
    $name = strtolower(trim((string)($business['name'] ?? '')));
    $name = preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9\s]/', '', $name));
    $address = strtolower(trim((string)($business['address'] ?? '')));
    if ($address !== '') {
        return "{$name}|{$address}";
    }
    $phone = preg_replace('/\D+/', '', (string)($business['phone'] ?? ''));
    if ($phone !== '') {
        return "{$name}|phone:{$phone}";
    }
    $host = '';
    $path = '';
    if (!empty($business['url'])) {
        $host = strtolower(trim(parse_url($business['url'], PHP_URL_HOST) ?? ''));
        $path = strtolower(trim(parse_url($business['url'], PHP_URL_PATH) ?? ''));
        $path = preg_replace('#/+#', '/', $path);
    }
    if ($host !== '') {
        if ($path !== '' && $path !== '/') {
            return "{$name}|host:{$host}|path:" . substr(sha1($path), 0, 12);
        }
        return "{$name}|host:{$host}";
    }
    $snippet = strtolower(trim((string)($business['snippet'] ?? '')));
    if ($snippet !== '') {
        $snippet = preg_replace('/\s+/', ' ', $snippet);
    }
    $ctx = strtolower(trim((string)$context));
    if ($ctx !== '' && $snippet !== '') {
        return "{$name}|{$ctx}|snip:" . substr(sha1($snippet), 0, 12);
    }
    if ($ctx !== '') {
        return "{$name}|{$ctx}";
    }
    if ($snippet !== '') {
        return "{$name}|snip:" . substr(sha1($snippet), 0, 12);
    }
    return $name;
}

/**
 * Minimum acceptable fill ratio for search results.
 */
function getSearchFillTargetRatio() {
    $ratio = defined('SEARCH_FILL_TARGET_RATIO') ? (float)SEARCH_FILL_TARGET_RATIO : 1.25;
    if ($ratio < 0.5) {
        $ratio = 0.5;
    }
    if ($ratio > 2.0) {
        $ratio = 2.0;
    }
    return $ratio;
}

/**
 * Minimum acceptable result count for a requested limit.
 * Always targets MORE than what was requested to guarantee over-delivery.
 */
function getSearchFillTargetCount($limit) {
    $limit = max(1, (int)$limit);
    return (int)ceil($limit * getSearchFillTargetRatio());
}

/**
 * Detect transient network-level failures that are usually worth retrying/fallback.
 */
function isTransientNetworkErrorMessage($message) {
    $msg = strtolower(trim((string)$message));
    if ($msg === '') {
        return false;
    }

    $patterns = [
        'timed out',
        'timeout',
        'http 0',
        'could not resolve host',
        'failed to connect',
        'connection reset',
        'connection refused',
        'temporarily unavailable',
        'operation too slow',
        'ssl connect error',
        'empty reply from server',
        'recv failure',
        'send failure',
    ];

    foreach ($patterns as $pattern) {
        if (strpos($msg, $pattern) !== false) {
            return true;
        }
    }

    return false;
}

/**
 * Normalize search filters from request input.
 */
function normalizeSearchFilters($input) {
    $filters = is_array($input) ? $input : [];
    $platforms = [];
    if (!empty($filters['platforms']) && is_array($filters['platforms'])) {
        foreach ($filters['platforms'] as $platform) {
            if (!is_string($platform)) continue;
            $platform = strtolower(trim($platform));
            if ($platform !== '') {
                $platforms[] = $platform;
            }
        }
    }

    return [
        'phoneOnly' => !empty($filters['phoneOnly']),
        'noWebsite' => !empty($filters['noWebsite']),
        'notMobile' => !empty($filters['notMobile']),
        'outdated' => !empty($filters['outdated']),
        'platforms' => array_values(array_unique($platforms)),
        'platformMode' => !empty($filters['platformMode']),
    ];
}

/**
 * Determine if any search filters are active.
 */
function hasAnySearchFilter($filters) {
    if (!is_array($filters)) return false;
    return !empty($filters['phoneOnly']) ||
        !empty($filters['noWebsite']) ||
        !empty($filters['notMobile']) ||
        !empty($filters['outdated']) ||
        (!empty($filters['platforms']) && count($filters['platforms']) > 0);
}

/**
 * Apply normalized search filters to a business result.
 */
function matchesSearchFilters($business, $filters) {
    if (!is_array($filters) || !hasAnySearchFilter($filters)) {
        return true;
    }

    $analysis = is_array($business['websiteAnalysis'] ?? null) ? $business['websiteAnalysis'] : [];
    $hasWebsite = array_key_exists('hasWebsite', $analysis) ? (bool)$analysis['hasWebsite'] : true;
    $needsUpgrade = array_key_exists('needsUpgrade', $analysis) ? (bool)$analysis['needsUpgrade'] : false;
    $issues = isset($analysis['issues']) && is_array($analysis['issues']) ? $analysis['issues'] : [];
    $platform = strtolower(trim((string)($analysis['platform'] ?? '')));
    $mobileScore = $analysis['mobileScore'] ?? null;

    if (!empty($filters['phoneOnly'])) {
        $phone = trim((string)($business['phone'] ?? ''));
        if ($phone === '') return false;
    }

    $qualityFiltersSelected = !empty($filters['noWebsite']) || !empty($filters['notMobile']) || !empty($filters['outdated']);
    if ($qualityFiltersSelected) {
        $qualityMatch = false;

        if (!empty($filters['noWebsite']) && !$hasWebsite) {
            $qualityMatch = true;
        }

        if (!empty($filters['notMobile'])) {
            $notMobile = true;
            if ($mobileScore !== null && $mobileScore !== '') {
                $notMobile = ((float)$mobileScore) < 60; // Catches weak mobile experience (was 50)
            }
            if ($notMobile) {
                $qualityMatch = true;
            }
        }

        if (!empty($filters['outdated']) && ($needsUpgrade || !empty($issues))) {
            $qualityMatch = true;
        }

        if (!$qualityMatch) {
            return false;
        }
    }

    $platforms = $filters['platforms'] ?? [];
    if (!empty($platforms)) {
        $normalizePlatform = function ($value) {
            $value = strtolower(trim((string)$value));
            return str_replace([' ', '.', '-', '_'], '', $value);
        };
        $platformToken = $normalizePlatform($platform);
        $normalizedPlatforms = array_values(array_unique(array_map($normalizePlatform, $platforms)));

        if (!empty($filters['platformMode']) && in_array('gmb', $normalizedPlatforms, true)) {
            return true;
        }
        $matchesPlatform = false;
        if ($platformToken !== '') {
            if (in_array($platformToken, $normalizedPlatforms, true)) {
                $matchesPlatform = true;
            } elseif ($platformToken === 'wordpresscom' && in_array('wordpress', $normalizedPlatforms, true)) {
                $matchesPlatform = true;
            } elseif ($platformToken === 'godaddysites' && in_array('godaddy', $normalizedPlatforms, true)) {
                $matchesPlatform = true;
            }
        }
        if (!empty($filters['platformMode'])) {
            $url = trim((string)($business['url'] ?? ''));
            $include = !$hasWebsite || $needsUpgrade || !empty($issues) || $matchesPlatform || $url === '';
            if (!$include) return false;
        } else {
            if (!$matchesPlatform) return false;
        }
    }

    return true;
}

/**
 * Make a cURL request
 * @param string $url The URL to request
 * @param array $options Additional cURL options
 * @param int $timeout Timeout in seconds (default 10)
 */
function curlRequest($url, $options = [], $timeout = 10) {
    $ch = curl_init();
    
    $defaultOptions = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'BamLead/1.0 (Website Analyzer)',
    ];
    
    curl_setopt_array($ch, $defaultOptions + $options);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'response' => $response,
        'httpCode' => $httpCode,
        'error' => $error
    ];
}

/**
 * Get cached result if available
 */
function getCache($key) {
    if (!defined('ENABLE_CACHE') || !ENABLE_CACHE) {
        return null;
    }
    
    // Validate cache key to prevent directory traversal
    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $key)) {
        return null;
    }
    
    $cacheFile = CACHE_DIR . '/' . md5($key) . '.cache';
    
    if (!file_exists($cacheFile)) {
        return null;
    }
    
    // Use JSON instead of unserialize to prevent object injection
    $contents = file_get_contents($cacheFile);
    $data = json_decode($contents, true);
    
    if (!$data || !isset($data['expires']) || $data['expires'] < time()) {
        @unlink($cacheFile);
        return null;
    }
    
    return $data['value'];
}

/**
 * Set cache value
 */
function setCache($key, $value, $ttl = null) {
    if (!defined('ENABLE_CACHE') || !ENABLE_CACHE) {
        return false;
    }
    
    // Validate cache key
    if (!preg_match('/^[a-zA-Z0-9_\-]+$/', $key)) {
        return false;
    }
    
    if (!is_dir(CACHE_DIR)) {
        @mkdir(CACHE_DIR, 0755, true);
    }
    
    $ttl = $ttl ?? CACHE_DURATION;
    $cacheFile = CACHE_DIR . '/' . md5($key) . '.cache';
    
    $data = [
        'expires' => time() + $ttl,
        'value' => $value
    ];
    
    // Use JSON instead of serialize for security
    return file_put_contents($cacheFile, json_encode($data)) !== false;
}

/**
 * Detect website platform from HTML
 */
function detectPlatform($html) {
    $html = strtolower($html);
    
    $platforms = [
        'WordPress' => ['wp-content', 'wordpress', 'wp-includes'],
        'Wix' => ['wix.com', 'wixsite.com', 'static.wixstatic.com'],
        'Squarespace' => ['squarespace', 'sqsp.net', 'static1.squarespace.com'],
        'Shopify' => ['shopify', 'cdn.shopify.com', 'myshopify.com'],
        'Webflow' => ['webflow', 'assets.website-files.com'],
        'GoDaddy' => ['godaddy', 'secureserver.net', 'godaddysites.com'],
        'Weebly' => ['weebly', 'weeblycloud.com'],
        'Joomla' => ['joomla', '/components/com_', '/modules/mod_'],
        'Drupal' => ['drupal', '/sites/default/files', 'drupal.settings'],
        'Magento' => ['magento', 'mage/', 'varien'],
        'PrestaShop' => ['prestashop', '/themes/default/', 'presta'],
        'OpenCart' => ['opencart', '/catalog/view/', 'route='],
        'Zen Cart' => ['zen cart', 'zen-cart', 'zencart'],
        'osCommerce' => ['oscommerce', 'osc_session'],
        'Jimdo' => ['jimdo', 'jimdofree', 'jimcdn.com'],
        'Web.com' => ['web.com', 'website-builder'],
        'BigCommerce' => ['bigcommerce', 'bigcommercecdn'],
        'Duda' => ['duda', 'dudaone', 'duda.co'],
        'HubSpot' => ['hubspot', 'hs-scripts', 'hscta'],
    ];
    
    foreach ($platforms as $name => $indicators) {
        foreach ($indicators as $indicator) {
            if (strpos($html, $indicator) !== false) {
                return $name;
            }
        }
    }
    
    // Check for basic indicators
    if (strpos($html, '<!doctype html>') !== false || strpos($html, '<!DOCTYPE html>') !== false) {
        // Check for any CMS indicators
        if (preg_match('/content="[^"]*generator[^"]*"/i', $html)) {
            return 'Custom CMS';
        }
    }
    
    // Check for very old sites
    if (strpos($html, '<table') !== false && strpos($html, 'width=') !== false) {
        return 'Custom HTML (Legacy)';
    }
    
    if (strpos($html, '.php') !== false) {
        return 'Custom PHP';
    }
    
    return 'Custom/Unknown';
}

/**
 * Detect website issues
 */
function detectIssues($html) {
    $issues = [];
    $htmlLower = strtolower($html);
    
    // Mobile responsiveness
    if (strpos($htmlLower, 'viewport') === false) {
        $issues[] = 'Not mobile responsive';
    }
    
    // Page size
    $pageSize = strlen($html);
    if ($pageSize > 500000) {
        $issues[] = 'Large page size (slow loading)';
    }
    
    // HTML5 doctype
    if (strpos($htmlLower, '<!doctype html>') === false) {
        $issues[] = 'Outdated HTML structure';
    }
    
    // Meta description
    if (strpos($htmlLower, 'meta name="description"') === false && 
        strpos($htmlLower, "meta name='description'") === false) {
        $issues[] = 'Missing meta description';
    }
    
    // Title tag
    if (strpos($htmlLower, '<title>') === false || strpos($htmlLower, '<title></title>') !== false) {
        $issues[] = 'Missing or empty title tag';
    }
    
    // Old jQuery
    if (preg_match('/jquery[.-]?1\.[0-9]/', $htmlLower) || 
        preg_match('/jquery[.-]?2\.[0-2]/', $htmlLower)) {
        $issues[] = 'Outdated jQuery version';
    }
    
    // Flash content
    if (strpos($htmlLower, 'swfobject') !== false || strpos($htmlLower, '.swf') !== false) {
        $issues[] = 'Uses Flash (deprecated)';
    }
    
    // Missing alt tags
    if (preg_match('/<img[^>]+(?!alt)[^>]*>/i', $html)) {
        $issues[] = 'Missing alt tags on images';
    }
    
    // Inline styles (indicator of old practices)
    $inlineStyleCount = substr_count($htmlLower, 'style="');
    if ($inlineStyleCount > 20) {
        $issues[] = 'Excessive inline styles';
    }
    
    // Tables for layout
    $tableCount = substr_count($htmlLower, '<table');
    if ($tableCount > 5 && strpos($htmlLower, 'width=') !== false) {
        $issues[] = 'Tables used for layout';
    }
    
    // HTTP resources on HTTPS
    if (preg_match('/src=["\']http:\/\//i', $html)) {
        $issues[] = 'Mixed content (HTTP on HTTPS)';
    }
    
    // Missing Open Graph tags
    if (strpos($htmlLower, 'og:') === false) {
        $issues[] = 'Missing social media meta tags';
    }
    
    // Missing favicon
    if (strpos($htmlLower, 'favicon') === false && strpos($htmlLower, 'icon') === false) {
        $issues[] = 'Missing favicon';
    }
    
    // ========== NEW DETECTIONS ==========
    
    // No Facebook Pixel
    $hasFacebookPixel = strpos($htmlLower, 'facebook.com/tr') !== false ||
                        strpos($htmlLower, 'fbq(') !== false ||
                        strpos($htmlLower, 'facebook-jssdk') !== false ||
                        strpos($htmlLower, 'connect.facebook.net') !== false;
    if (!$hasFacebookPixel) {
        $issues[] = 'No Facebook Pixel installed';
    }
    
    // No Google Tag / Analytics
    $hasGoogleTag = strpos($htmlLower, 'googletagmanager.com') !== false ||
                    strpos($htmlLower, 'gtag(') !== false ||
                    strpos($htmlLower, 'google-analytics.com') !== false ||
                    strpos($htmlLower, 'analytics.js') !== false ||
                    strpos($htmlLower, 'gtm.js') !== false ||
                    strpos($htmlLower, 'ga(') !== false;
    if (!$hasGoogleTag) {
        $issues[] = 'No Google Analytics or Tag Manager';
    }
    
    // No booking system or contact funnel
    $hasBookingSystem = strpos($htmlLower, 'calendly') !== false ||
                        strpos($htmlLower, 'acuityscheduling') !== false ||
                        strpos($htmlLower, 'booksy') !== false ||
                        strpos($htmlLower, 'simplybook') !== false ||
                        strpos($htmlLower, 'schedulicity') !== false ||
                        strpos($htmlLower, 'square.com/appointments') !== false ||
                        strpos($htmlLower, 'setmore') !== false ||
                        strpos($htmlLower, 'appointy') !== false ||
                        strpos($htmlLower, 'booking.com') !== false ||
                        strpos($htmlLower, 'book-now') !== false ||
                        strpos($htmlLower, 'book now') !== false ||
                        strpos($htmlLower, 'schedule-appointment') !== false ||
                        strpos($htmlLower, 'schedule appointment') !== false ||
                        strpos($htmlLower, 'book-online') !== false ||
                        strpos($htmlLower, 'book online') !== false;
    
    $hasContactFunnel = strpos($htmlLower, 'contact-form') !== false ||
                        strpos($htmlLower, 'contact form') !== false ||
                        strpos($htmlLower, 'wpcf7') !== false ||
                        strpos($htmlLower, 'wpforms') !== false ||
                        strpos($htmlLower, 'gravity-forms') !== false ||
                        strpos($htmlLower, 'typeform') !== false ||
                        strpos($htmlLower, 'jotform') !== false ||
                        strpos($htmlLower, 'formspree') !== false ||
                        strpos($htmlLower, 'hubspot-form') !== false ||
                        strpos($htmlLower, 'input type="email"') !== false ||
                        (strpos($htmlLower, '<form') !== false && strpos($htmlLower, 'submit') !== false);
    
    if (!$hasBookingSystem && !$hasContactFunnel) {
        $issues[] = 'No booking system or contact funnel';
    } else if (!$hasBookingSystem) {
        $issues[] = 'No online booking system';
    }
    
    // Inactive/weak social profiles (check for social links)
    $hasFacebookLink = strpos($htmlLower, 'facebook.com/') !== false;
    $hasInstagramLink = strpos($htmlLower, 'instagram.com/') !== false;
    $hasTwitterLink = strpos($htmlLower, 'twitter.com/') !== false || strpos($htmlLower, 'x.com/') !== false;
    $hasLinkedInLink = strpos($htmlLower, 'linkedin.com/') !== false;
    $hasYouTubeLink = strpos($htmlLower, 'youtube.com/') !== false;
    
    $socialCount = ($hasFacebookLink ? 1 : 0) + ($hasInstagramLink ? 1 : 0) + 
                   ($hasTwitterLink ? 1 : 0) + ($hasLinkedInLink ? 1 : 0) + ($hasYouTubeLink ? 1 : 0);
    
    if ($socialCount === 0) {
        $issues[] = 'No social media presence linked';
    } else if ($socialCount === 1) {
        $issues[] = 'Weak social media presence (only 1 platform)';
    }
    
    // Severely outdated website indicators
    $severelyOutdated = false;
    $outdatedIndicators = 0;
    
    if (strpos($htmlLower, '<!doctype html>') === false) $outdatedIndicators++;
    if (preg_match('/jquery[.-]?1\.[0-5]/', $htmlLower)) $outdatedIndicators++;
    if (strpos($htmlLower, 'swfobject') !== false || strpos($htmlLower, '.swf') !== false) $outdatedIndicators++;
    if ($tableCount > 5 && strpos($htmlLower, 'width=') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'viewport') === false) $outdatedIndicators++;
    if (preg_match('/copyright\s*(©|&copy;)?\s*(19[89]\d|200[0-9]|201[0-5])/i', $htmlLower)) $outdatedIndicators++;
    if (strpos($htmlLower, 'font face=') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'marquee') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'bgsound') !== false) $outdatedIndicators++;
    if (strpos($htmlLower, 'frameset') !== false || strpos($htmlLower, 'iframe') === false && strpos($htmlLower, '<frame') !== false) $outdatedIndicators++;
    
    if ($outdatedIndicators >= 2) {
        $needsUpgrade = true; // Lower threshold: 2+ indicators = needs upgrade (was 4)
        $issues[] = 'Outdated website (needs upgrade)';
    }
    if ($outdatedIndicators >= 4) {
        $issues[] = 'Severely outdated website (needs complete rebuild)';
    }
    
    // Check for no SSL/HTTPS indicators
    if (preg_match_all('/href=["\']http:\/\/(?!localhost)/i', $html, $httpMatches) && count($httpMatches[0]) > 3) {
        $issues[] = 'Multiple non-secure HTTP links';
    }
    
    // Check for spending money but leaking leads (has ads but no conversion tracking)
    $hasAds = strpos($htmlLower, 'googlesyndication') !== false ||
              strpos($htmlLower, 'doubleclick') !== false ||
              strpos($htmlLower, 'adsense') !== false ||
              strpos($htmlLower, 'adsbygoogle') !== false;
    
    $hasConversionTracking = $hasFacebookPixel || $hasGoogleTag ||
                             strpos($htmlLower, 'hotjar') !== false ||
                             strpos($htmlLower, 'clarity.ms') !== false ||
                             strpos($htmlLower, 'mixpanel') !== false ||
                             strpos($htmlLower, 'segment.com') !== false;
    
    if ($hasAds && !$hasConversionTracking) {
        $issues[] = 'Spending on ads but no conversion tracking (leaking leads)';
    }
    
    // No call-to-action buttons detected
    $hasCTA = preg_match('/(get\s*(started|quote|estimate)|call\s*now|contact\s*us|request\s*(quote|appointment)|free\s*(consultation|estimate)|schedule|book\s*(now|today))/i', $htmlLower);
    if (!$hasCTA) {
        $issues[] = 'No clear call-to-action buttons';
    }
    
    return $issues;
}

/**
 * Analyze a website and return analysis data
 */
function analyzeWebsite($url) {
    if (empty($url)) {
        return [
            'hasWebsite' => false,
            'platform' => null,
            'needsUpgrade' => true,
            'issues' => ['No website found'],
            'mobileScore' => null,
            'loadTime' => null
        ];
    }
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    $startTime = microtime(true);
    
    $result = curlRequest($url, [
        CURLOPT_TIMEOUT => WEBSITE_TIMEOUT,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    
    $loadTime = round((microtime(true) - $startTime) * 1000); // ms
    
    $analysis = [
        'hasWebsite' => $result['httpCode'] === 200,
        'platform' => null,
        'needsUpgrade' => false,
        'issues' => [],
        'mobileScore' => null,
        'loadTime' => $loadTime
    ];
    
    if ($result['httpCode'] !== 200 || empty($result['response'])) {
        $analysis['hasWebsite'] = false;
        $analysis['needsUpgrade'] = true;
        $analysis['issues'][] = 'Website not accessible';
        return $analysis;
    }
    
    $html = $result['response'];
    
    // Detect platform
    $analysis['platform'] = detectPlatform($html);
    
    // Detect issues
    $analysis['issues'] = detectIssues($html);
    
    // Calculate mobile score (simplified)
    $mobileScore = 100;
    if (strpos(strtolower($html), 'viewport') === false) {
        $mobileScore -= 40;
    }
    if (strlen($html) > 300000) {
        $mobileScore -= 20;
    }
    if ($loadTime > 3000) {
        $mobileScore -= 20;
    }
    foreach ($analysis['issues'] as $issue) {
        $mobileScore -= 5;
    }
    $analysis['mobileScore'] = max(0, min(100, $mobileScore));
    
    // Determine if needs upgrade
    $lowPriorityPlatforms = ['WordPress', 'Wix', 'Weebly', 'GoDaddy', 'Joomla', 'Drupal'];
    $analysis['needsUpgrade'] = 
        count($analysis['issues']) >= 2 ||
        in_array($analysis['platform'], $lowPriorityPlatforms) ||
        $analysis['mobileScore'] < 60 ||
        $loadTime > 4000;
    
    return $analysis;
}

/**
 * Extract phone numbers from text
 */
function extractPhoneNumbers($text) {
    $phones = [];
    
    // US phone patterns
    $patterns = [
        '/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/',
        '/\d{3}[-.\s]\d{3}[-.\s]\d{4}/',
        '/1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/',
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match_all($pattern, $text, $matches)) {
            $phones = array_merge($phones, $matches[0]);
        }
    }
    
    return array_unique($phones);
}

/**
 * Extract email addresses from text
 */
function extractEmails($text) {
    if (!is_string($text) || $text === '') {
        return [];
    }

    $emails = [];

    // Decode common encodings first so regex can catch obfuscated values.
    $decodedText = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $decodedText = urldecode($decodedText);

    // Standard email pattern.
    if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $decodedText, $matches)) {
        $emails = array_merge($emails, $matches[0]);
    }

    // Extract from mailto links (can include query string and URL-encoded @).
    if (preg_match_all('/mailto:([^"\'\s>]+)/i', $decodedText, $mailtoMatches)) {
        foreach ($mailtoMatches[1] as $mailtoTarget) {
            $candidate = urldecode((string)$mailtoTarget);
            $candidate = preg_replace('/\?.*/', '', $candidate);
            if ($candidate !== '') {
                $emails[] = $candidate;
            }
        }
    }

    // Extract [at]/[dot] style obfuscated emails.
    if (preg_match_all('/([a-z0-9._%+\-]+)\s*(?:\(|\[|\{)?\s*(?:@|at)\s*(?:\)|\]|\})?\s*([a-z0-9.\-]+)\s*(?:\(|\[|\{)?\s*(?:\.|dot)\s*(?:\)|\]|\})?\s*([a-z]{2,})/i', $decodedText, $obfuscatedMatches, PREG_SET_ORDER)) {
        foreach ($obfuscatedMatches as $parts) {
            $local = $parts[1] ?? '';
            $domainBase = $parts[2] ?? '';
            $tld = $parts[3] ?? '';
            if ($local !== '' && $domainBase !== '' && $tld !== '') {
                $emails[] = "{$local}@{$domainBase}.{$tld}";
            }
        }
    }

    // Decode Cloudflare-protected addresses from data-cfemail.
    if (preg_match_all('/data-cfemail=["\']([a-f0-9]+)["\']/i', $decodedText, $cfMatches)) {
        foreach ($cfMatches[1] as $encoded) {
            $encoded = trim((string)$encoded);
            if (strlen($encoded) < 4 || strlen($encoded) % 2 !== 0) {
                continue;
            }
            $key = hexdec(substr($encoded, 0, 2));
            $decoded = '';
            for ($i = 2; $i < strlen($encoded); $i += 2) {
                $decoded .= chr(hexdec(substr($encoded, $i, 2)) ^ $key);
            }
            if ($decoded !== '') {
                $emails[] = $decoded;
            }
        }
    }

    // Extract emails from JSON-LD / schema.org structured data
    if (preg_match_all('/"email"\s*:\s*"([^"]+)"/i', $decodedText, $schemaEmails)) {
        $emails = array_merge($emails, $schemaEmails[1]);
    }
    if (preg_match_all('/"contactPoint"\s*:\s*\{[^}]*"email"\s*:\s*"([^"]+)"/i', $decodedText, $cpEmails)) {
        $emails = array_merge($emails, $cpEmails[1]);
    }

    // Extract from HTML meta tags (some sites put email in meta content)
    if (preg_match_all('/<meta[^>]+content=["\']([^"\']*@[^"\']*)["\'][^>]*>/i', $decodedText, $metaEmails)) {
        foreach ($metaEmails[1] as $metaVal) {
            if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $metaVal, $innerMatches)) {
                $emails = array_merge($emails, $innerMatches[0]);
            }
        }
    }

    // Extract from href="mailto:" even when URL-encoded @ as %40
    if (preg_match_all('/href=["\'][^"\']*%40[^"\']*["\']/i', $decodedText, $pctMatches)) {
        foreach ($pctMatches[0] as $hrefChunk) {
            $decoded2 = urldecode($hrefChunk);
            if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $decoded2, $innerMatches)) {
                $emails = array_merge($emails, $innerMatches[0]);
            }
        }
    }

    // Wix-style unicode-encoded emails (\u0040 = @)
    $unicodeDecoded = preg_replace_callback('/\\\\u([0-9a-fA-F]{4})/', function ($m) {
        return mb_convert_encoding(pack('H*', $m[1]), 'UTF-8', 'UCS-2BE');
    }, $text);
    if ($unicodeDecoded !== $decodedText && is_string($unicodeDecoded)) {
        if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $unicodeDecoded, $wixMatches)) {
            $emails = array_merge($emails, $wixMatches[0]);
        }
    }

    // Extract from data attributes (data-email, data-mail, data-contact)
    if (preg_match_all('/data-(?:email|mail|contact)=["\']([^"\']+)["\']/i', $decodedText, $dataAttrMatches)) {
        foreach ($dataAttrMatches[1] as $attrVal) {
            if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $attrVal, $innerMatch)) {
                $emails[] = $innerMatch[0];
            }
        }
    }

    $emails = array_unique($emails);

    // Filter out invalid/spam emails
    $filtered = [];
    $excludePatterns = ['example.com', 'test.com', 'domain.com', 'email.com', 'sample.', 'noreply', 'no-reply', 
                        'wixpress', 'sentry.io', 'cloudflare', 'google.com', 'facebook.com', 'twitter.com', 
                        'instagram.com', 'linkedin.com', 'youtube.com', 'placeholder', 'yoursite', 'yourdomain',
                        'webpack', 'localhost', 'jquery', 'bootstrap', '.png', '.jpg', '.gif', '.svg', '.css', '.js',
                        // Junk from CSS/JS/font code artifacts
                        'fonts.gst', 'alayer.push', 'woff', 'eot', 'ttf', 'otf',
                        'googleusercontent', 'gstatic', 'googleapis', 'schema.org',
                        'w3.org', 'mozilla.org', 'apple.com', 'microsoft.com',
                        'github.com', 'npmjs', 'jsdelivr', 'cdnjs', 'unpkg',
                        'sentry-next', 'polyfill', 'tracker', 'analytics',
                        'mailchimp', 'hubspot', 'sendgrid', 'mailgun'];
    
    // Additional junk TLD patterns (not real business emails)
    $junkTlds = ['.push', '.woff', '.eot', '.ttf', '.map', '.min', '.bundle', '.chunk',
                 '.webpack', '.module', '.local', '.internal', '.invalid', '.test'];
    
    foreach ($emails as $email) {
        $emailLower = strtolower($email);
        $isValid = true;
        foreach ($excludePatterns as $pattern) {
            if (strpos($emailLower, $pattern) !== false) {
                $isValid = false;
                break;
            }
        }
        // Check junk TLDs
        if ($isValid) {
            foreach ($junkTlds as $junkTld) {
                if (str_ends_with($emailLower, $junkTld)) {
                    $isValid = false;
                    break;
                }
            }
        }
        // Filter emails with local part too short (likely code artifacts)
        if ($isValid && strlen(explode('@', $emailLower)[0]) < 2) {
            $isValid = false;
        }
        // Filter emails where domain has no valid TLD (e.g. d@alayer.push)
        if ($isValid) {
            $domain = explode('@', $emailLower)[1] ?? '';
            $tld = pathinfo($domain, PATHINFO_EXTENSION);
            $validTlds = ['com','net','org','edu','gov','io','co','us','uk','ca','au','de','fr','es','it','nl','be','at','ch','se','no','dk','fi','pt','pl','cz','ie','nz','za','mx','br','ar','cl','in','jp','kr','cn','sg','hk','tw','my','ph','th','id','vn','ru','ua','il','ae','sa','qa','biz','info','pro','me','tv','cc','ly','fm','am','gg','to','xyz','app','dev','tech','agency','digital','studio','design','media','marketing','consulting','solutions','services','group','team','works','systems','cloud','online','store','shop','site','website','blog','email','support','help','contact'];
            if (!in_array($tld, $validTlds)) {
                $isValid = false;
            }
        }
        if ($isValid && strlen($email) < 100 && filter_var($emailLower, FILTER_VALIDATE_EMAIL)) {
            $filtered[] = $emailLower;
        }
    }
    
    return array_values(array_unique($filtered));
}

/**
 * Scrape website for contact information (email, phone)
 * Checks homepage, footer, and common contact page URLs
 * 
 * @param string $url Website URL
 * @param int $timeout Request timeout in seconds
 * @return array Contact info with emails and phones found
 */
function scrapeWebsiteForContacts($url, $timeout = 8) {
    if (empty($url)) {
        return ['emails' => [], 'phones' => [], 'hasWebsite' => false, 'pagesChecked' => []];
    }
    
    // Ensure URL has protocol
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }
    
    // Parse and get base URL
    $parsed = parse_url($url);
    if (!$parsed || empty($parsed['host'])) {
        return ['emails' => [], 'phones' => [], 'hasWebsite' => false, 'pagesChecked' => []];
    }
    
    $scheme = $parsed['scheme'] ?? 'https';
    $host = $parsed['host'];
    $baseUrl = "{$scheme}://{$host}";
    
    $allEmails = [];
    $allPhones = [];
    $pagesChecked = [];
    $pagesQueued = [];
    $queuedSet = [];
    $hasWebsite = false;

    // Queue seed pages (homepage + common contact routes).
    $seedPaths = [
        '',
        '/contact',
        '/contact-us',
        '/contactus',
        '/about',
        '/about-us',
        '/get-in-touch',
        '/reach-us',
        '/team',
        '/support',
        '/help',
        '/connect',
        '/locations',
        '/privacy',
        '/privacy-policy',
        '/terms',
        '/legal',
        '/imprint',
        '/impressum',
    ];
    foreach ($seedPaths as $path) {
        $pageUrl = $baseUrl . $path;
        $normalized = rtrim(strtolower($pageUrl), '/');
        if ($normalized === '') {
            $normalized = strtolower($pageUrl);
        }
        if (!isset($queuedSet[$normalized])) {
            $queuedSet[$normalized] = true;
            $pagesQueued[] = $pageUrl;
        }
    }

    // Deep crawl defaults tuned for contact discovery.
    // These can be overridden in config.php.
    $pagesLimit = defined('CONTACT_SCRAPE_MAX_PAGES') ? max(3, (int)CONTACT_SCRAPE_MAX_PAGES) : 8;
    $queueLimit = defined('CONTACT_SCRAPE_MAX_QUEUE') ? max(8, (int)CONTACT_SCRAPE_MAX_QUEUE) : 24;
    $earlyStopEmails = defined('CONTACT_SCRAPE_EARLY_STOP_EMAILS') ? max(1, (int)CONTACT_SCRAPE_EARLY_STOP_EMAILS) : 2;
    $pagesScraped = 0;

    while (!empty($pagesQueued) && $pagesScraped < $pagesLimit) {
        // Stop early only after we have enough emails and at least 2 successful page scrapes.
        if (count($allEmails) >= $earlyStopEmails && $pagesScraped >= 2) {
            break;
        }

        $pageUrl = array_shift($pagesQueued);
        if (!$pageUrl) {
            continue;
        }

        if (in_array($pageUrl, $pagesChecked, true)) {
            continue;
        }
        
        $result = curlRequest($pageUrl, [
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ], $timeout);
        
        $pagesChecked[] = $pageUrl;
        
        if ($result['httpCode'] !== 200 || empty($result['response'])) {
            continue;
        }
        
        $hasWebsite = true;
        $pagesScraped++;
        $html = $result['response'];
        
        // Extract emails from page
        $pageEmails = extractEmails($html);
        $allEmails = array_merge($allEmails, $pageEmails);
        
        // Extract phones from page
        $pagePhones = extractPhoneNumbers($html);
        $allPhones = array_merge($allPhones, $pagePhones);
        
        // Check for tel: links
        if (preg_match_all('/tel:([+\d\-\(\)\s\.]+)/', $html, $telMatches)) {
            $allPhones = array_merge($allPhones, $telMatches[1]);
        }

        // Discover likely contact pages from links on fetched pages.
        if (preg_match_all('/<a[^>]+href=["\']([^"\']+)["\']/i', $html, $linkMatches)) {
            foreach ($linkMatches[1] as $href) {
                $href = trim(html_entity_decode((string)$href, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                if ($href === '' || strpos($href, '#') === 0) {
                    continue;
                }
                if (preg_match('/^(mailto:|tel:|javascript:)/i', $href)) {
                    continue;
                }

                $candidate = '';
                if (preg_match('/^https?:\/\//i', $href)) {
                    $candidate = $href;
                } elseif (strpos($href, '//') === 0) {
                    $candidate = "{$scheme}:{$href}";
                } elseif (strpos($href, '/') === 0) {
                    $candidate = $baseUrl . $href;
                } else {
                    $candidate = $baseUrl . '/' . ltrim($href, '/');
                }

                $parsedCandidate = parse_url($candidate);
                if (!$parsedCandidate || empty($parsedCandidate['host'])) {
                    continue;
                }
                if (strtolower($parsedCandidate['host']) !== strtolower($host)) {
                    continue;
                }

                $path = strtolower((string)($parsedCandidate['path'] ?? ''));
                if (!preg_match('/(contact|about|team|staff|support|help|connect|get[-_ ]?in[-_ ]?touch|reach|location|book|appointment|privacy|legal|terms|impressum|imprint|footer)/i', $path)) {
                    continue;
                }

                $normalized = rtrim(strtolower($candidate), '/');
                if ($normalized === '') {
                    $normalized = strtolower($candidate);
                }
                if (isset($queuedSet[$normalized])) {
                    continue;
                }
                if (count($pagesQueued) >= $queueLimit) {
                    break;
                }
                $queuedSet[$normalized] = true;
                $pagesQueued[] = $candidate;
            }
        }
    }
    
    // Dedupe and clean
    $allEmails = array_values(array_unique($allEmails));
    $allPhones = array_values(array_unique(array_map(function($p) {
        return preg_replace('/[^\d+]/', '', $p);
    }, $allPhones)));
    
    // Filter phones - only valid US format (10+ digits)
    $allPhones = array_filter($allPhones, function($p) {
        $digits = preg_replace('/\D/', '', $p);
        return strlen($digits) >= 10;
    });
    
    return [
        'emails' => array_slice($allEmails, 0, 5), // Limit to 5 emails
        'phones' => array_slice(array_values($allPhones), 0, 3), // Limit to 3 phones
        'hasWebsite' => $hasWebsite,
        'pagesChecked' => $pagesChecked
    ];
}

/**
 * Generate a unique ID
 */
function generateId($prefix = '') {
    return $prefix . uniqid() . '_' . bin2hex(random_bytes(4));
}

/**
 * Get the client's real IP address (handles proxies)
 */
function getClientIP() {
    // Check for forwarded IP (when behind proxy/load balancer)
    $forwardedFor = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if (!empty($forwardedFor)) {
        // Take the first IP (original client) if comma-separated
        $ips = explode(',', $forwardedFor);
        return trim($ips[0]);
    }
    
    // Check X-Real-IP header
    if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        return $_SERVER['HTTP_X_REAL_IP'];
    }
    
    // Fall back to remote address
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Check if request IP is allowed for cron endpoints
 * Returns true if CRON_ALLOWED_IPS is not defined or empty (backwards compatible)
 */
function isAllowedCronIP() {
    // If whitelist not configured, allow all (backwards compatible)
    if (!defined('CRON_ALLOWED_IPS') || !is_array(CRON_ALLOWED_IPS) || empty(CRON_ALLOWED_IPS)) {
        return true;
    }
    
    $clientIP = getClientIP();
    
    // Check if IP is in whitelist
    return in_array($clientIP, CRON_ALLOWED_IPS, true);
}
