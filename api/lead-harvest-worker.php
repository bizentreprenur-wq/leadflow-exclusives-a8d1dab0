<?php
/**
 * Lead Harvest Worker (Experimental)
 *
 * Runs continuously (24/7) from CLI:
 * - Pulls due jobs from lead_harvest_jobs
 * - Discovers/enriches leads using existing custom fetcher pipeline
 * - Stores deduplicated records in lead_harvest_records
 * - Stores keyword/location/category mappings in lead_harvest_record_matches
 *
 * Usage examples:
 *   php api/lead-harvest-worker.php
 *   php api/lead-harvest-worker.php --once
 *   php api/lead-harvest-worker.php --job-id=3 --once
 *   php api/lead-harvest-worker.php --keyword="plumbers" --location="houston, tx" --category="home_services" --limit=250 --interval=60 --add-job-only
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/database.php';
require_once __DIR__ . '/includes/custom_fetcher.php';

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'CLI only']);
    exit(1);
}

set_exception_handler(function (Throwable $e) {
    $message = 'Unhandled exception in lead-harvest-worker: ' . $e->getMessage();
    error_log($message);
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
});

if (!defined('LEAD_HARVEST_WORKER_IDLE_SLEEP_SEC')) {
    define('LEAD_HARVEST_WORKER_IDLE_SLEEP_SEC', 20);
}
if (!defined('LEAD_HARVEST_MAX_LIMIT_PER_JOB')) {
    define('LEAD_HARVEST_MAX_LIMIT_PER_JOB', 1500);
}
if (!defined('LEAD_HARVEST_MIN_LIMIT_PER_JOB')) {
    define('LEAD_HARVEST_MIN_LIMIT_PER_JOB', 20);
}
if (!defined('LEAD_HARVEST_DEEP_SCRAPE_TIMEOUT_SEC')) {
    define('LEAD_HARVEST_DEEP_SCRAPE_TIMEOUT_SEC', 6);
}
if (!defined('LEAD_HARVEST_DEEP_SCRAPE_MAX_PER_JOB')) {
    define('LEAD_HARVEST_DEEP_SCRAPE_MAX_PER_JOB', 120);
}
if (!defined('LEAD_HARVEST_FAILURE_RETRY_MINUTES')) {
    define('LEAD_HARVEST_FAILURE_RETRY_MINUTES', 15);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_MODE')) {
    define('LEAD_HARVEST_AUTONOMOUS_MODE', true);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_MAX_ACTIVE_JOBS')) {
    define('LEAD_HARVEST_AUTONOMOUS_MAX_ACTIVE_JOBS', 3000);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_INSERT_PER_IDLE')) {
    define('LEAD_HARVEST_AUTONOMOUS_INSERT_PER_IDLE', 10);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_DEFAULT_LIMIT')) {
    define('LEAD_HARVEST_AUTONOMOUS_DEFAULT_LIMIT', 120);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_INTERVAL_MINUTES')) {
    define('LEAD_HARVEST_AUTONOMOUS_INTERVAL_MINUTES', 120);
}

$options = getopt('', [
    'once',
    'job-id:',
    'sleep:',
    'max-jobs:',
    'keyword:',
    'location:',
    'category:',
    'limit:',
    'interval:',
    'owner-user-id:',
    'add-job-only',
]);

$runOnce = array_key_exists('once', $options);
$forcedJobId = isset($options['job-id']) ? (int) $options['job-id'] : null;
$idleSleep = isset($options['sleep']) ? max(2, (int) $options['sleep']) : (int) LEAD_HARVEST_WORKER_IDLE_SLEEP_SEC;
$maxJobs = isset($options['max-jobs']) ? max(1, (int) $options['max-jobs']) : 0;

$pdo = getDbConnection();

if (isset($options['keyword'], $options['location'])) {
    $jobId = upsertHarvestJobFromCli($pdo, $options);
    workerLog("Job upserted: #{$jobId}");
    if (array_key_exists('add-job-only', $options)) {
        exit(0);
    }
    if ($forcedJobId === null) {
        $forcedJobId = $jobId;
        $runOnce = true;
    }
}

workerLog('Lead harvest worker started');

$processedJobs = 0;

while (true) {
    try {
        $job = acquireDueJob($pdo, $forcedJobId);
    } catch (Throwable $e) {
        workerLog('Failed acquiring job: ' . $e->getMessage());
        if ($runOnce) {
            exit(1);
        }
        sleep($idleSleep);
        continue;
    }

    if (!$job) {
        $autoInserted = queueAutonomousJobsIfEnabled($pdo);
        if ($autoInserted > 0) {
            workerLog("Autonomous mode queued {$autoInserted} new job(s).");
            continue;
        }
        if ($runOnce) {
            workerLog('No due job found. Exiting (--once).');
            break;
        }
        sleep($idleSleep);
        continue;
    }

    $forcedJobId = null;
    try {
        $result = processHarvestJob($pdo, $job);
        $processedJobs++;

        workerLog(sprintf(
            'Job #%d done: discovered=%d touched_records=%d runtime=%dms',
            (int) $job['id'],
            (int) $result['discovered_count'],
            (int) $result['record_count'],
            (int) $result['runtime_ms']
        ));

        if ($runOnce) {
            break;
        }
        if ($maxJobs > 0 && $processedJobs >= $maxJobs) {
            workerLog("Reached --max-jobs={$maxJobs}. Exiting.");
            break;
        }
    } catch (Throwable $e) {
        $jobId = (int) ($job['id'] ?? 0);
        $errorMessage = $e->getMessage();
        workerLog("Job #{$jobId} failed: {$errorMessage}");

        try {
            if ($jobId > 0) {
                markHarvestJobFailed($pdo, $jobId, $errorMessage);
            }
        } catch (Throwable $markError) {
            workerLog("Failed to mark job #{$jobId} as failed: " . $markError->getMessage());
        }

        if ($runOnce) {
            exit(1);
        }
        sleep($idleSleep);
    }
}

workerLog('Lead harvest worker stopped');
exit(0);

function workerLog($message)
{
    $line = sprintf("[%s] [LeadHarvestWorker] %s", gmdate('Y-m-d H:i:s'), (string) $message);
    echo $line . PHP_EOL;
    error_log($line);
}

function clampInt($value, $min, $max)
{
    $n = (int) $value;
    if ($n < $min) {
        return $min;
    }
    if ($n > $max) {
        return $max;
    }
    return $n;
}

function normalizeIndexValue($value)
{
    $value = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/i', ' ', $value);
    $value = trim(preg_replace('/\s+/', ' ', $value));
    return $value;
}

function normalizePhone($phone)
{
    $digits = preg_replace('/\D+/', '', (string) $phone);
    if ($digits === '') {
        return '';
    }
    if (strlen($digits) === 11 && strpos($digits, '1') === 0) {
        $digits = substr($digits, 1);
    }
    if (strlen($digits) === 10) {
        return sprintf('(%s) %s-%s', substr($digits, 0, 3), substr($digits, 3, 3), substr($digits, 6));
    }
    return $digits;
}

function normalizeUrlValue($url)
{
    $url = trim((string) $url);
    if ($url === '') {
        return '';
    }
    if (!preg_match('/^https?:\/\//i', $url)) {
        $url = 'https://' . $url;
    }
    $parts = parse_url($url);
    if (!$parts || empty($parts['host'])) {
        return '';
    }
    $scheme = strtolower((string) ($parts['scheme'] ?? 'https'));
    $host = strtolower((string) $parts['host']);
    $path = isset($parts['path']) ? rtrim((string) $parts['path'], '/') : '';
    $query = isset($parts['query']) ? ('?' . (string) $parts['query']) : '';
    return $scheme . '://' . $host . $path . $query;
}

function extractDomain($url)
{
    $url = normalizeUrlValue($url);
    if ($url === '') {
        return '';
    }
    $host = (string) parse_url($url, PHP_URL_HOST);
    return strtolower($host);
}

function parseLocationParts($location)
{
    $location = trim((string) $location);
    if ($location === '') {
        return ['city' => null, 'state' => null];
    }

    $city = null;
    $state = null;

    if (strpos($location, ',') !== false) {
        $parts = array_map('trim', explode(',', $location, 2));
        $city = $parts[0] !== '' ? $parts[0] : null;
        if (!empty($parts[1])) {
            $stateToken = preg_split('/\s+/', (string) $parts[1]);
            $state = strtoupper(trim((string) ($stateToken[0] ?? '')));
            if ($state === '') {
                $state = null;
            }
        }
    } else {
        $city = $location;
    }

    return ['city' => $city, 'state' => $state];
}

function valueOrNull($value, $maxLength = 500)
{
    if ($value === null) {
        return null;
    }
    $value = trim((string) $value);
    if ($value === '') {
        return null;
    }
    if (strlen($value) > $maxLength) {
        $value = substr($value, 0, $maxLength);
    }
    return $value;
}

function firstNonEmpty($values)
{
    foreach ((array) $values as $value) {
        $text = trim((string) $value);
        if ($text !== '') {
            return $text;
        }
    }
    return '';
}

function buildRecordDedupeKey($businessName, $websiteUrl, $phone, $address, $locationNorm)
{
    $parts = [
        normalizeIndexValue($businessName),
        normalizeIndexValue(extractDomain($websiteUrl)),
        normalizeIndexValue(preg_replace('/\D+/', '', (string) $phone)),
        normalizeIndexValue($address),
        normalizeIndexValue($locationNorm),
    ];

    return hash('sha256', implode('|', $parts));
}

function acquireDueJob(PDO $pdo, $forcedJobId = null)
{
    $pdo->beginTransaction();
    try {
        if ($forcedJobId !== null) {
            $stmt = $pdo->prepare(
                "SELECT * FROM lead_harvest_jobs
                 WHERE id = :id AND enabled = 1 AND status <> 'paused'
                 LIMIT 1
                 FOR UPDATE"
            );
            $stmt->execute(['id' => (int) $forcedJobId]);
        } else {
            $stmt = $pdo->prepare(
                "SELECT * FROM lead_harvest_jobs
                 WHERE enabled = 1
                   AND status IN ('pending', 'completed', 'failed')
                   AND next_run_at <= NOW()
                 ORDER BY next_run_at ASC, id ASC
                 LIMIT 1
                 FOR UPDATE"
            );
            $stmt->execute();
        }

        $job = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$job) {
            $pdo->commit();
            return null;
        }

        $update = $pdo->prepare(
            "UPDATE lead_harvest_jobs
             SET status = 'running',
                 last_started_at = NOW(),
                 last_error = NULL,
                 run_count = run_count + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id"
        );
        $update->execute(['id' => (int) $job['id']]);

        $pdo->commit();
        $job['status'] = 'running';
        return $job;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function upsertHarvestJobFromCli(PDO $pdo, array $options)
{
    $keyword = trim((string) ($options['keyword'] ?? ''));
    $location = trim((string) ($options['location'] ?? ''));
    if ($keyword === '' || $location === '') {
        throw new InvalidArgumentException('--keyword and --location are required to upsert a job');
    }

    $category = trim((string) ($options['category'] ?? $keyword));
    $keywordNorm = normalizeIndexValue($keyword);
    $locationNorm = normalizeIndexValue($location);

    $targetLimit = isset($options['limit'])
        ? clampInt((int) $options['limit'], (int) LEAD_HARVEST_MIN_LIMIT_PER_JOB, (int) LEAD_HARVEST_MAX_LIMIT_PER_JOB)
        : 100;
    $interval = isset($options['interval']) ? max(1, (int) $options['interval']) : 60;

    $ownerUserId = null;
    if (isset($options['owner-user-id'])) {
        $ownerUserId = max(1, (int) $options['owner-user-id']);
    }

    $findSql =
        "SELECT id
         FROM lead_harvest_jobs
         WHERE keyword_norm = :keyword_norm
           AND location_norm = :location_norm
           AND category = :category
           AND ((owner_user_id = :owner_user_id) OR (:owner_user_id IS NULL AND owner_user_id IS NULL))
         LIMIT 1";

    $findStmt = $pdo->prepare($findSql);
    $findStmt->execute([
        'keyword_norm' => $keywordNorm,
        'location_norm' => $locationNorm,
        'category' => $category,
        'owner_user_id' => $ownerUserId,
    ]);

    $existing = $findStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $update = $pdo->prepare(
            "UPDATE lead_harvest_jobs
             SET keyword = :keyword,
                 location = :location,
                 target_limit = :target_limit,
                 run_interval_minutes = :run_interval_minutes,
                 enabled = 1,
                 status = 'pending',
                 next_run_at = NOW(),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id"
        );
        $update->execute([
            'keyword' => $keyword,
            'location' => $location,
            'target_limit' => $targetLimit,
            'run_interval_minutes' => $interval,
            'id' => (int) $existing['id'],
        ]);
        return (int) $existing['id'];
    }

    $insert = $pdo->prepare(
        "INSERT INTO lead_harvest_jobs
         (owner_user_id, keyword, location, category, keyword_norm, location_norm, target_limit, run_interval_minutes, enabled, status, next_run_at)
         VALUES
         (:owner_user_id, :keyword, :location, :category, :keyword_norm, :location_norm, :target_limit, :run_interval_minutes, 1, 'pending', NOW())"
    );

    $insert->execute([
        'owner_user_id' => $ownerUserId,
        'keyword' => $keyword,
        'location' => $location,
        'category' => $category,
        'keyword_norm' => $keywordNorm,
        'location_norm' => $locationNorm,
        'target_limit' => $targetLimit,
        'run_interval_minutes' => $interval,
    ]);

    return (int) $pdo->lastInsertId();
}

function autonomousKeywordSeeds()
{
    return [
        ['keyword' => 'plumbers', 'category' => 'home_services'],
        ['keyword' => 'electricians', 'category' => 'home_services'],
        ['keyword' => 'hvac contractors', 'category' => 'home_services'],
        ['keyword' => 'roofing companies', 'category' => 'home_services'],
        ['keyword' => 'landscaping services', 'category' => 'home_services'],
        ['keyword' => 'pest control', 'category' => 'home_services'],
        ['keyword' => 'auto repair shops', 'category' => 'automotive'],
        ['keyword' => 'collision repair', 'category' => 'automotive'],
        ['keyword' => 'car detailing', 'category' => 'automotive'],
        ['keyword' => 'dentists', 'category' => 'healthcare'],
        ['keyword' => 'chiropractors', 'category' => 'healthcare'],
        ['keyword' => 'physical therapy clinics', 'category' => 'healthcare'],
        ['keyword' => 'family law attorneys', 'category' => 'legal'],
        ['keyword' => 'personal injury attorneys', 'category' => 'legal'],
        ['keyword' => 'accounting firms', 'category' => 'finance'],
        ['keyword' => 'bookkeeping services', 'category' => 'finance'],
        ['keyword' => 'real estate agents', 'category' => 'real_estate'],
        ['keyword' => 'property management companies', 'category' => 'real_estate'],
        ['keyword' => 'restaurants', 'category' => 'food'],
        ['keyword' => 'coffee shops', 'category' => 'food'],
        ['keyword' => 'marketing agencies', 'category' => 'b2b_services'],
        ['keyword' => 'web design agencies', 'category' => 'b2b_services'],
        ['keyword' => 'software development companies', 'category' => 'b2b_services'],
        ['keyword' => 'cleaning services', 'category' => 'local_services'],
        ['keyword' => 'moving companies', 'category' => 'local_services'],
        ['keyword' => 'security system installers', 'category' => 'local_services'],
        ['keyword' => 'salons', 'category' => 'beauty'],
        ['keyword' => 'med spas', 'category' => 'beauty'],
        ['keyword' => 'tattoo studios', 'category' => 'beauty'],
        ['keyword' => 'gyms', 'category' => 'fitness'],
    ];
}

function autonomousLocationSeeds()
{
    $stateToAnchorCity = [
        'AL' => 'Birmingham', 'AK' => 'Anchorage', 'AZ' => 'Phoenix', 'AR' => 'Little Rock', 'CA' => 'Los Angeles',
        'CO' => 'Denver', 'CT' => 'Bridgeport', 'DE' => 'Wilmington', 'DC' => 'Washington', 'FL' => 'Miami',
        'GA' => 'Atlanta', 'HI' => 'Honolulu', 'ID' => 'Boise', 'IL' => 'Chicago', 'IN' => 'Indianapolis',
        'IA' => 'Des Moines', 'KS' => 'Wichita', 'KY' => 'Louisville', 'LA' => 'New Orleans', 'ME' => 'Portland',
        'MD' => 'Baltimore', 'MA' => 'Boston', 'MI' => 'Detroit', 'MN' => 'Minneapolis', 'MS' => 'Jackson',
        'MO' => 'Kansas City', 'MT' => 'Billings', 'NE' => 'Omaha', 'NV' => 'Las Vegas', 'NH' => 'Manchester',
        'NJ' => 'Newark', 'NM' => 'Albuquerque', 'NY' => 'New York', 'NC' => 'Charlotte', 'ND' => 'Fargo',
        'OH' => 'Columbus', 'OK' => 'Oklahoma City', 'OR' => 'Portland', 'PA' => 'Philadelphia', 'RI' => 'Providence',
        'SC' => 'Charleston', 'SD' => 'Sioux Falls', 'TN' => 'Nashville', 'TX' => 'Houston', 'UT' => 'Salt Lake City',
        'VT' => 'Burlington', 'VA' => 'Virginia Beach', 'WA' => 'Seattle', 'WV' => 'Charleston', 'WI' => 'Milwaukee',
        'WY' => 'Cheyenne',
    ];

    $stateNames = [
        'AL' => 'Alabama', 'AK' => 'Alaska', 'AZ' => 'Arizona', 'AR' => 'Arkansas', 'CA' => 'California',
        'CO' => 'Colorado', 'CT' => 'Connecticut', 'DE' => 'Delaware', 'DC' => 'District of Columbia', 'FL' => 'Florida',
        'GA' => 'Georgia', 'HI' => 'Hawaii', 'ID' => 'Idaho', 'IL' => 'Illinois', 'IN' => 'Indiana',
        'IA' => 'Iowa', 'KS' => 'Kansas', 'KY' => 'Kentucky', 'LA' => 'Louisiana', 'ME' => 'Maine',
        'MD' => 'Maryland', 'MA' => 'Massachusetts', 'MI' => 'Michigan', 'MN' => 'Minnesota', 'MS' => 'Mississippi',
        'MO' => 'Missouri', 'MT' => 'Montana', 'NE' => 'Nebraska', 'NV' => 'Nevada', 'NH' => 'New Hampshire',
        'NJ' => 'New Jersey', 'NM' => 'New Mexico', 'NY' => 'New York', 'NC' => 'North Carolina', 'ND' => 'North Dakota',
        'OH' => 'Ohio', 'OK' => 'Oklahoma', 'OR' => 'Oregon', 'PA' => 'Pennsylvania', 'RI' => 'Rhode Island',
        'SC' => 'South Carolina', 'SD' => 'South Dakota', 'TN' => 'Tennessee', 'TX' => 'Texas', 'UT' => 'Utah',
        'VT' => 'Vermont', 'VA' => 'Virginia', 'WA' => 'Washington', 'WV' => 'West Virginia', 'WI' => 'Wisconsin',
        'WY' => 'Wyoming',
    ];

    $seeds = [];
    foreach ($stateToAnchorCity as $stateCode => $city) {
        $seeds[] = "{$city}, {$stateCode}";
    }

    // Add state-wide targets so every U.S. state can be covered even when city-level search is sparse.
    foreach ($stateNames as $stateCode => $stateName) {
        $seeds[] = "{$stateName}, US";
        $seeds[] = "{$stateCode}, US";

        if (function_exists('getStateCityShards')) {
            $shards = getStateCityShards($stateCode);
            foreach ((array) $shards as $shard) {
                $shard = trim((string) $shard);
                if ($shard !== '') {
                    $seeds[] = $shard;
                }
            }
        }
    }

    // Keep deterministic order while removing duplicates.
    $unique = [];
    $seen = [];
    foreach ($seeds as $seed) {
        $normalized = normalizeIndexValue($seed);
        if ($normalized === '' || isset($seen[$normalized])) {
            continue;
        }
        $seen[$normalized] = true;
        $unique[] = $seed;
    }

    return $unique;
}

function queueAutonomousJobsIfEnabled(PDO $pdo)
{
    if (!LEAD_HARVEST_AUTONOMOUS_MODE) {
        return 0;
    }

    $countStmt = $pdo->query(
        "SELECT COUNT(*) AS c
         FROM lead_harvest_jobs
         WHERE enabled = 1"
    );
    $currentEnabled = (int) (($countStmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0));
    $maxJobs = max(10, (int) LEAD_HARVEST_AUTONOMOUS_MAX_ACTIVE_JOBS);
    if ($currentEnabled >= $maxJobs) {
        return 0;
    }

    $keywords = autonomousKeywordSeeds();
    $locations = autonomousLocationSeeds();
    if (empty($keywords) || empty($locations)) {
        return 0;
    }

    $slots = min(
        max(1, (int) LEAD_HARVEST_AUTONOMOUS_INSERT_PER_IDLE),
        $maxJobs - $currentEnabled
    );

    $combinations = [];
    foreach ($keywords as $seed) {
        $keyword = trim((string) ($seed['keyword'] ?? ''));
        $category = trim((string) ($seed['category'] ?? 'general'));
        if ($keyword === '') {
            continue;
        }
        foreach ($locations as $location) {
            $location = trim((string) $location);
            if ($location === '') {
                continue;
            }
            $combinations[] = [
                'keyword' => $keyword,
                'category' => $category,
                'location' => $location,
            ];
        }
    }
    if (empty($combinations)) {
        return 0;
    }

    // Rotate combinations deterministically over time to avoid always seeding the same first subset.
    $combinationCount = count($combinations);
    $rotationOffset = (int) (time() / 300) % $combinationCount;
    $rotated = array_merge(
        array_slice($combinations, $rotationOffset),
        array_slice($combinations, 0, $rotationOffset)
    );

    $limit = clampInt(
        (int) LEAD_HARVEST_AUTONOMOUS_DEFAULT_LIMIT,
        (int) LEAD_HARVEST_MIN_LIMIT_PER_JOB,
        (int) LEAD_HARVEST_MAX_LIMIT_PER_JOB
    );
    $interval = max(10, (int) LEAD_HARVEST_AUTONOMOUS_INTERVAL_MINUTES);

    $existsStmt = $pdo->prepare(
        "SELECT id
         FROM lead_harvest_jobs
         WHERE owner_user_id IS NULL
           AND keyword_norm = :keyword_norm
           AND location_norm = :location_norm
           AND category = :category
         LIMIT 1"
    );
    $pokeStmt = $pdo->prepare(
        "UPDATE lead_harvest_jobs
         SET enabled = 1,
             status = CASE WHEN status = 'paused' THEN 'pending' ELSE status END,
             next_run_at = LEAST(next_run_at, NOW()),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id"
    );
    $insertStmt = $pdo->prepare(
        "INSERT INTO lead_harvest_jobs
         (owner_user_id, keyword, location, category, keyword_norm, location_norm, target_limit, run_interval_minutes, enabled, status, next_run_at)
         VALUES
         (NULL, :keyword, :location, :category, :keyword_norm, :location_norm, :target_limit, :run_interval_minutes, 1, 'pending', NOW())"
    );

    $inserted = 0;
    foreach ($rotated as $combo) {
        if ($inserted >= $slots) {
            break;
        }

        $keywordNorm = normalizeIndexValue($combo['keyword']);
        $locationNorm = normalizeIndexValue($combo['location']);
        if ($keywordNorm === '' || $locationNorm === '') {
            continue;
        }

        $existsStmt->execute([
            'keyword_norm' => $keywordNorm,
            'location_norm' => $locationNorm,
            'category' => $combo['category'],
        ]);
        $existingId = (int) (($existsStmt->fetch(PDO::FETCH_ASSOC)['id'] ?? 0));
        if ($existingId > 0) {
            $pokeStmt->execute(['id' => $existingId]);
            continue;
        }

        $insertStmt->execute([
            'keyword' => $combo['keyword'],
            'location' => $combo['location'],
            'category' => $combo['category'],
            'keyword_norm' => $keywordNorm,
            'location_norm' => $locationNorm,
            'target_limit' => $limit,
            'run_interval_minutes' => $interval,
        ]);
        $inserted++;
    }

    return $inserted;
}

function processHarvestJob(PDO $pdo, array $job)
{
    $startedAt = microtime(true);

    $jobId = (int) ($job['id'] ?? 0);
    $keyword = trim((string) ($job['keyword'] ?? ''));
    $location = trim((string) ($job['location'] ?? ''));
    $category = trim((string) ($job['category'] ?? $keyword));
    $keywordNorm = normalizeIndexValue($keyword);
    $locationNorm = normalizeIndexValue($location);

    $targetLimit = clampInt(
        (int) ($job['target_limit'] ?? 100),
        (int) LEAD_HARVEST_MIN_LIMIT_PER_JOB,
        (int) LEAD_HARVEST_MAX_LIMIT_PER_JOB
    );

    $intervalMinutes = max(1, (int) ($job['run_interval_minutes'] ?? 60));

    if ($keyword === '' || $location === '') {
        throw new RuntimeException("Job #{$jobId} is missing keyword/location");
    }

    $filters = [];
    $filtersActive = false;
    $targetCount = $targetLimit;

    $leads = customFetcherSearchAndEnrich(
        $keyword,
        $location,
        $targetLimit,
        $filters,
        $filtersActive,
        $targetCount
    );

    if (!is_array($leads)) {
        $leads = [];
    }

    $locationParts = parseLocationParts($location);
    $cityFromJob = $locationParts['city'];
    $stateFromJob = $locationParts['state'];

    $websiteSignalsCache = [];
    $deepScrapeBudget = (int) LEAD_HARVEST_DEEP_SCRAPE_MAX_PER_JOB;
    $deepScrapeUsed = 0;
    $touchedRecordIds = [];

    foreach ($leads as $lead) {
        if (!is_array($lead)) {
            continue;
        }

        $persisted = persistHarvestLead(
            $pdo,
            $jobId,
            $category,
            $keyword,
            $keywordNorm,
            $location,
            $locationNorm,
            $lead,
            $cityFromJob,
            $stateFromJob,
            $websiteSignalsCache,
            $deepScrapeBudget,
            $deepScrapeUsed
        );

        if ($persisted !== null) {
            $touchedRecordIds[$persisted] = true;
        }
    }

    $recordCount = count($touchedRecordIds);
    $nextRunAt = gmdate('Y-m-d H:i:s', time() + ($intervalMinutes * 60));

    $done = $pdo->prepare(
        "UPDATE lead_harvest_jobs
         SET status = 'completed',
             last_finished_at = NOW(),
             next_run_at = :next_run_at,
             last_result_count = :last_result_count,
             total_result_count = total_result_count + :last_result_count,
             last_error = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id"
    );

    $done->execute([
        'next_run_at' => $nextRunAt,
        'last_result_count' => $recordCount,
        'id' => $jobId,
    ]);

    return [
        'job_id' => $jobId,
        'discovered_count' => count($leads),
        'record_count' => $recordCount,
        'runtime_ms' => (int) round((microtime(true) - $startedAt) * 1000),
    ];
}

function markHarvestJobFailed(PDO $pdo, $jobId, $errorMessage)
{
    $retryAt = gmdate('Y-m-d H:i:s', time() + ((int) LEAD_HARVEST_FAILURE_RETRY_MINUTES * 60));
    $message = trim((string) $errorMessage);
    if ($message === '') {
        $message = 'Unknown worker error';
    }
    if (strlen($message) > 4000) {
        $message = substr($message, 0, 4000);
    }

    $stmt = $pdo->prepare(
        "UPDATE lead_harvest_jobs
         SET status = 'failed',
             last_finished_at = NOW(),
             next_run_at = :next_run_at,
             last_error = :last_error,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id"
    );
    $stmt->execute([
        'next_run_at' => $retryAt,
        'last_error' => $message,
        'id' => (int) $jobId,
    ]);
}

function persistHarvestLead(
    PDO $pdo,
    $jobId,
    $category,
    $keyword,
    $keywordNorm,
    $location,
    $locationNorm,
    array $lead,
    $cityFromJob,
    $stateFromJob,
    array &$websiteSignalsCache,
    $deepScrapeBudget,
    &$deepScrapeUsed
) {
    $businessName = firstNonEmpty([$lead['name'] ?? null, $lead['business_name'] ?? null, 'Unknown Business']);
    $websiteUrl = normalizeUrlValue(firstNonEmpty([$lead['url'] ?? null, $lead['website'] ?? null]));

    $enrichment = isset($lead['enrichment']) && is_array($lead['enrichment']) ? $lead['enrichment'] : [];
    $socials = isset($enrichment['socials']) && is_array($enrichment['socials']) ? $enrichment['socials'] : [];

    $emails = [];
    $phones = [];

    $primaryEmail = trim((string) ($lead['email'] ?? ''));
    $primaryPhone = normalizePhone($lead['phone'] ?? '');

    if ($primaryEmail !== '') {
        $emails[] = strtolower($primaryEmail);
    }
    if ($primaryPhone !== '') {
        $phones[] = $primaryPhone;
    }

    foreach ((array) ($enrichment['emails'] ?? []) as $email) {
        $email = strtolower(trim((string) $email));
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $emails[] = $email;
        }
    }

    foreach ((array) ($enrichment['phones'] ?? []) as $phone) {
        $phone = normalizePhone($phone);
        if ($phone !== '') {
            $phones[] = $phone;
        }
    }

    $needDeepSignals =
        $websiteUrl !== '' &&
        (
            empty($emails) ||
            empty($phones) ||
            empty($socials['facebook']) ||
            empty($socials['linkedin']) ||
            empty($socials['instagram']) ||
            empty($socials['youtube'])
        );

    if ($needDeepSignals && $deepScrapeUsed < $deepScrapeBudget) {
        $signals = getWebsiteSignals($websiteUrl, $websiteSignalsCache, (int) LEAD_HARVEST_DEEP_SCRAPE_TIMEOUT_SEC);
        $deepScrapeUsed++;

        foreach ($signals['emails'] as $email) {
            $email = strtolower(trim((string) $email));
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $emails[] = $email;
            }
        }

        foreach ($signals['phones'] as $phone) {
            $phone = normalizePhone($phone);
            if ($phone !== '') {
                $phones[] = $phone;
            }
        }

        foreach (['facebook', 'linkedin', 'instagram', 'youtube'] as $socialKey) {
            if (empty($socials[$socialKey]) && !empty($signals['socials'][$socialKey])) {
                $socials[$socialKey] = $signals['socials'][$socialKey];
            }
        }
    }

    $emails = array_values(array_unique(array_filter($emails)));
    $phones = array_values(array_unique(array_filter($phones)));

    $finalEmail = $emails[0] ?? null;
    $finalPhone = $phones[0] ?? null;

    $address = valueOrNull($lead['address'] ?? null, 500);
    $city = valueOrNull($cityFromJob, 120);
    $stateCode = valueOrNull($stateFromJob, 32);

    $recordDedupeKey = buildRecordDedupeKey(
        $businessName,
        $websiteUrl,
        $finalPhone,
        (string) $address,
        $locationNorm
    );

    $websiteDomain = valueOrNull(extractDomain($websiteUrl), 255);

    $recordSql =
        "INSERT INTO lead_harvest_records
         (dedupe_key, business_name, business_name_norm, website_url, website_domain, facebook_url, linkedin_url, instagram_url, youtube_url, email, phone, address, city, state_code, country_code, source, raw_payload, first_seen_at, last_seen_at)
         VALUES
         (:dedupe_key, :business_name, :business_name_norm, :website_url, :website_domain, :facebook_url, :linkedin_url, :instagram_url, :youtube_url, :email, :phone, :address, :city, :state_code, 'US', :source, :raw_payload, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            business_name = IF(VALUES(business_name) <> '', VALUES(business_name), business_name),
            business_name_norm = VALUES(business_name_norm),
            website_url = COALESCE(NULLIF(VALUES(website_url), ''), website_url),
            website_domain = COALESCE(NULLIF(VALUES(website_domain), ''), website_domain),
            facebook_url = COALESCE(NULLIF(VALUES(facebook_url), ''), facebook_url),
            linkedin_url = COALESCE(NULLIF(VALUES(linkedin_url), ''), linkedin_url),
            instagram_url = COALESCE(NULLIF(VALUES(instagram_url), ''), instagram_url),
            youtube_url = COALESCE(NULLIF(VALUES(youtube_url), ''), youtube_url),
            email = COALESCE(NULLIF(VALUES(email), ''), email),
            phone = COALESCE(NULLIF(VALUES(phone), ''), phone),
            address = COALESCE(NULLIF(VALUES(address), ''), address),
            city = COALESCE(NULLIF(VALUES(city), ''), city),
            state_code = COALESCE(NULLIF(VALUES(state_code), ''), state_code),
            source = COALESCE(NULLIF(VALUES(source), ''), source),
            raw_payload = VALUES(raw_payload),
            last_seen_at = NOW(),
            updated_at = CURRENT_TIMESTAMP,
            id = LAST_INSERT_ID(id)";

    $recordStmt = $pdo->prepare($recordSql);
    $recordStmt->execute([
        'dedupe_key' => $recordDedupeKey,
        'business_name' => valueOrNull($businessName, 255) ?? 'Unknown Business',
        'business_name_norm' => normalizeIndexValue($businessName),
        'website_url' => valueOrNull($websiteUrl, 500),
        'website_domain' => $websiteDomain,
        'facebook_url' => valueOrNull($socials['facebook'] ?? null, 500),
        'linkedin_url' => valueOrNull($socials['linkedin'] ?? null, 500),
        'instagram_url' => valueOrNull($socials['instagram'] ?? null, 500),
        'youtube_url' => valueOrNull($socials['youtube'] ?? null, 500),
        'email' => valueOrNull($finalEmail, 255),
        'phone' => valueOrNull($finalPhone, 64),
        'address' => $address,
        'city' => $city,
        'state_code' => $stateCode,
        'source' => valueOrNull($lead['source'] ?? 'custom_one_shot_fetcher', 120),
        'raw_payload' => json_encode($lead),
    ]);

    $recordId = (int) $pdo->lastInsertId();
    if ($recordId <= 0) {
        return null;
    }

    $matchSql =
        "INSERT INTO lead_harvest_record_matches
         (record_id, job_id, category, keyword, location, keyword_norm, location_norm, hits, first_seen_at, last_seen_at)
         VALUES
         (:record_id, :job_id, :category, :keyword, :location, :keyword_norm, :location_norm, 1, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            job_id = VALUES(job_id),
            category = VALUES(category),
            keyword = VALUES(keyword),
            location = VALUES(location),
            hits = hits + 1,
            last_seen_at = NOW(),
            updated_at = CURRENT_TIMESTAMP";

    $matchStmt = $pdo->prepare($matchSql);
    $matchStmt->execute([
        'record_id' => $recordId,
        'job_id' => (int) $jobId,
        'category' => valueOrNull($category, 120) ?? normalizeIndexValue($keyword),
        'keyword' => valueOrNull($keyword, 255) ?? '',
        'location' => valueOrNull($location, 255) ?? '',
        'keyword_norm' => valueOrNull($keywordNorm, 255) ?? '',
        'location_norm' => valueOrNull($locationNorm, 255) ?? '',
    ]);

    return $recordId;
}

function getWebsiteSignals($websiteUrl, array &$cache, $timeout)
{
    $cacheKey = extractDomain($websiteUrl);
    if ($cacheKey === '') {
        return ['emails' => [], 'phones' => [], 'socials' => []];
    }

    if (isset($cache[$cacheKey])) {
        return $cache[$cacheKey];
    }

    $signals = [
        'emails' => [],
        'phones' => [],
        'socials' => [],
    ];

    $contact = scrapeWebsiteForContacts($websiteUrl, max(3, (int) $timeout));
    if (is_array($contact)) {
        $signals['emails'] = array_values(array_unique((array) ($contact['emails'] ?? [])));
        $signals['phones'] = array_values(array_unique((array) ($contact['phones'] ?? [])));
    }

    $homepageResp = curlRequest($websiteUrl, [CURLOPT_SSL_VERIFYPEER => false], max(3, (int) $timeout));
    if ((int) ($homepageResp['httpCode'] ?? 0) >= 200 && (int) ($homepageResp['httpCode'] ?? 0) < 400) {
        $html = (string) ($homepageResp['response'] ?? '');

        if ($html !== '') {
            $signals['emails'] = array_values(array_unique(array_merge($signals['emails'], extractEmails($html))));
            $signals['phones'] = array_values(array_unique(array_merge($signals['phones'], extractPhoneNumbers($html))));

            if (function_exists('customFetcherExtractSocials')) {
                $socials = customFetcherExtractSocials($html);
                if (is_array($socials)) {
                    $signals['socials'] = $socials;
                }
            }
        }
    }

    $cache[$cacheKey] = $signals;
    return $signals;
}
