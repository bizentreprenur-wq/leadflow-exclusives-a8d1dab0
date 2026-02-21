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
    define('LEAD_HARVEST_MAX_LIMIT_PER_JOB', 3000);
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
    define('LEAD_HARVEST_AUTONOMOUS_INSERT_PER_IDLE', 30);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_DEFAULT_LIMIT')) {
    define('LEAD_HARVEST_AUTONOMOUS_DEFAULT_LIMIT', 250);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_INTERVAL_MINUTES')) {
    define('LEAD_HARVEST_AUTONOMOUS_INTERVAL_MINUTES', 45);
}
if (!defined('LEAD_HARVEST_STALE_RUNNING_MINUTES')) {
    define('LEAD_HARVEST_STALE_RUNNING_MINUTES', 30);
}
if (!defined('LEAD_HARVEST_ONCE_BATCH_JOBS')) {
    define('LEAD_HARVEST_ONCE_BATCH_JOBS', 12);
}
if (!defined('LEAD_HARVEST_FALLBACK_QUERY_MAX')) {
    define('LEAD_HARVEST_FALLBACK_QUERY_MAX', 80);
}
if (!defined('LEAD_HARVEST_AUTONOMOUS_MAX_DUE_JOBS')) {
    define('LEAD_HARVEST_AUTONOMOUS_MAX_DUE_JOBS', 600);
}
if (!defined('LEAD_HARVEST_DIRECT_AUTONOMOUS_MODE')) {
    define('LEAD_HARVEST_DIRECT_AUTONOMOUS_MODE', true);
}
if (!defined('LEAD_HARVEST_DIRECT_BATCH_JOBS')) {
    define('LEAD_HARVEST_DIRECT_BATCH_JOBS', 8);
}
if (!defined('LEAD_HARVEST_DB_RECONNECT_RETRIES')) {
    define('LEAD_HARVEST_DB_RECONNECT_RETRIES', 2);
}
if (!defined('LEAD_HARVEST_NO_KEY_TIMEOUT_SEC')) {
    define('LEAD_HARVEST_NO_KEY_TIMEOUT_SEC', 8);
}
if (!defined('LEAD_HARVEST_NO_KEY_PER_QUERY_LIMIT')) {
    define('LEAD_HARVEST_NO_KEY_PER_QUERY_LIMIT', 140);
}
if (!defined('LEAD_HARVEST_NO_KEY_MAX_QUERIES_PER_JOB')) {
    define('LEAD_HARVEST_NO_KEY_MAX_QUERIES_PER_JOB', 70);
}
if (!defined('LEAD_HARVEST_TEXAS_FOCUS_MODE')) {
    define('LEAD_HARVEST_TEXAS_FOCUS_MODE', true);
}
if (!defined('LEAD_HARVEST_TEXAS_ONLY_MODE')) {
    define('LEAD_HARVEST_TEXAS_ONLY_MODE', true); //false
}
if (!defined('LEAD_HARVEST_TEXAS_PRIORITY_PERCENT')) {
    define('LEAD_HARVEST_TEXAS_PRIORITY_PERCENT', 100); //95
}
if (!defined('LEAD_HARVEST_TEXAS_CITY_SEED_LIMIT')) {
    define('LEAD_HARVEST_TEXAS_CITY_SEED_LIMIT', 240);
}
if (!defined('LEAD_HARVEST_NON_TEXAS_SEED_LIMIT')) {
    define('LEAD_HARVEST_NON_TEXAS_SEED_LIMIT', 0); //120
}
if (!defined('LEAD_HARVEST_HOUSTON_FOCUS_MODE')) {
    define('LEAD_HARVEST_HOUSTON_FOCUS_MODE', true);
}
if (!defined('LEAD_HARVEST_HOUSTON_ONLY_MODE')) {
    define('LEAD_HARVEST_HOUSTON_ONLY_MODE', false);
}
if (!defined('LEAD_HARVEST_HOUSTON_PRIORITY_PERCENT')) {
    define('LEAD_HARVEST_HOUSTON_PRIORITY_PERCENT', 65);
}
if (!defined('LEAD_HARVEST_HOUSTON_SEED_LIMIT')) {
    define('LEAD_HARVEST_HOUSTON_SEED_LIMIT', 90);
}

$options = getopt('', [
    'once',
    'once-jobs:',
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
$onceBatchJobs = isset($options['once-jobs'])
    ? max(1, (int) $options['once-jobs'])
    : max(1, (int) LEAD_HARVEST_ONCE_BATCH_JOBS);

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
        if (!ensurePdoAlive($pdo, 'main_loop_preflight')) {
            throw new RuntimeException('Unable to re-establish DB connection');
        }
        recoverStaleRunningJobs($pdo);
    } catch (Throwable $e) {
        workerLog('Failed preflight DB check: ' . $e->getMessage());
        if ($runOnce) {
            exit(1);
        }
        sleep($idleSleep);
        continue;
    }

    if ($forcedJobId === null && LEAD_HARVEST_DIRECT_AUTONOMOUS_MODE) {
        $directBatchSize = $runOnce
            ? $onceBatchJobs
            : max(1, (int) LEAD_HARVEST_DIRECT_BATCH_JOBS);
        try {
            $directProcessed = runDirectAutonomousBatch($pdo, $directBatchSize);
        } catch (Throwable $e) {
            workerLog('Direct autonomous batch failed: ' . $e->getMessage());
            if ($runOnce) {
                exit(1);
            }
            sleep($idleSleep);
            continue;
        }
        if ($directProcessed > 0) {
            $processedJobs += $directProcessed;
            if ($runOnce) {
                break;
            }
            if ($maxJobs > 0 && $processedJobs >= $maxJobs) {
                workerLog("Reached --max-jobs={$maxJobs}. Exiting.");
                break;
            }
            continue;
        }
    }

    try {
        queueAutonomousJobsIfEnabled($pdo);
    } catch (Throwable $e) {
        if (isMysqlGoneAwayException($e) && reconnectPdo($pdo, 'queue_autonomous_jobs')) {
            try {
                queueAutonomousJobsIfEnabled($pdo);
            } catch (Throwable $retryError) {
                workerLog('Failed queueing autonomous jobs after reconnect: ' . $retryError->getMessage());
            }
        } else {
            workerLog('Failed queueing autonomous jobs: ' . $e->getMessage());
        }
    }

    $job = null;
    try {
        $job = acquireDueJob($pdo, $forcedJobId);
    } catch (Throwable $e) {
        if (isMysqlGoneAwayException($e) && reconnectPdo($pdo, 'acquire_due_job')) {
            try {
                $job = acquireDueJob($pdo, $forcedJobId);
            } catch (Throwable $retryError) {
                workerLog('Failed acquiring job after reconnect: ' . $retryError->getMessage());
                if ($runOnce) {
                    exit(1);
                }
                sleep($idleSleep);
                continue;
            }
        } else {
            workerLog('Failed acquiring job: ' . $e->getMessage());
            if ($runOnce) {
                exit(1);
            }
            sleep($idleSleep);
            continue;
        }
    }

    if (!$job) {
        if ($runOnce) {
            workerLog("No due job found. Exiting (--once, processed {$processedJobs} job(s)).");
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

        if ($runOnce && $processedJobs >= $onceBatchJobs) {
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
            if (
                $jobId > 0 &&
                isMysqlGoneAwayException($markError) &&
                reconnectPdo($pdo, "mark_failed_job_{$jobId}")
            ) {
                try {
                    markHarvestJobFailed($pdo, $jobId, $errorMessage);
                } catch (Throwable $retryMarkError) {
                    workerLog("Failed to mark job #{$jobId} as failed after reconnect: " . $retryMarkError->getMessage());
                }
            } else {
                workerLog("Failed to mark job #{$jobId} as failed: " . $markError->getMessage());
            }
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

function isMysqlGoneAwayException(Throwable $e)
{
    $message = strtolower((string) $e->getMessage());
    if ($message === '') {
        return false;
    }

    $needles = [
        'mysql server has gone away',
        'lost connection to mysql server',
        'sqlstate[hy000]: general error: 2006',
        'sqlstate[hy000]: general error: 2013',
    ];
    foreach ($needles as $needle) {
        if (strpos($message, $needle) !== false) {
            return true;
        }
    }

    return false;
}

function reconnectPdo(&$pdo, $context = '')
{
    $retries = max(1, (int) LEAD_HARVEST_DB_RECONNECT_RETRIES);
    for ($attempt = 1; $attempt <= $retries; $attempt++) {
        try {
            $pdo = getDbConnection();
            $pdo->query('SELECT 1');
            if ($context !== '') {
                workerLog("DB reconnect succeeded ({$context}) on attempt {$attempt}.");
            }
            return true;
        } catch (Throwable $e) {
            if ($attempt >= $retries) {
                if ($context !== '') {
                    workerLog("DB reconnect failed ({$context}): " . $e->getMessage());
                }
                return false;
            }
            usleep(250000);
        }
    }
    return false;
}

function ensurePdoAlive(&$pdo, $context = '')
{
    try {
        $pdo->query('SELECT 1');
        return true;
    } catch (Throwable $e) {
        if (!isMysqlGoneAwayException($e)) {
            throw $e;
        }
        if ($context !== '') {
            workerLog("DB connection dropped ({$context}), attempting reconnect.");
        }
        return reconnectPdo($pdo, $context);
    }
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

function safeJsonEncode($value)
{
    $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    if ($encoded !== false) {
        return $encoded;
    }
    $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    if ($encoded !== false) {
        return $encoded;
    }
    return null;
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
                 WHERE id = :id
                   AND enabled = 1
                   AND status IN ('pending', 'completed', 'failed')
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

function recoverStaleRunningJobs(PDO $pdo)
{
    $minutes = max(5, (int) LEAD_HARVEST_STALE_RUNNING_MINUTES);
    $stmt = $pdo->prepare(
        "UPDATE lead_harvest_jobs
         SET status = 'failed',
             last_finished_at = NOW(),
             next_run_at = NOW(),
             last_error = 'Auto-recovered stale running job',
             updated_at = CURRENT_TIMESTAMP
         WHERE status = 'running'
           AND last_started_at IS NOT NULL
           AND last_started_at < DATE_SUB(NOW(), INTERVAL :minutes MINUTE)"
    );
    $stmt->bindValue(':minutes', $minutes, PDO::PARAM_INT);
    $stmt->execute();
    $count = (int) $stmt->rowCount();
    if ($count > 0) {
        workerLog("Recovered {$count} stale running job(s).");
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

    if ($ownerUserId === null) {
        $findSql =
            "SELECT id
             FROM lead_harvest_jobs
             WHERE keyword_norm = ?
               AND location_norm = ?
               AND category = ?
               AND owner_user_id IS NULL
             LIMIT 1";
        $findParams = [$keywordNorm, $locationNorm, $category];
    } else {
        $findSql =
            "SELECT id
             FROM lead_harvest_jobs
             WHERE keyword_norm = ?
               AND location_norm = ?
               AND category = ?
               AND owner_user_id = ?
             LIMIT 1";
        $findParams = [$keywordNorm, $locationNorm, $category, $ownerUserId];
    }

    $findStmt = $pdo->prepare($findSql);
    $findStmt->execute($findParams);

    $existing = $findStmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $update = $pdo->prepare(
            "UPDATE lead_harvest_jobs
             SET keyword = ?,
                 location = ?,
                 target_limit = ?,
                 run_interval_minutes = ?,
                 enabled = 1,
                 status = 'pending',
                 next_run_at = NOW(),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?"
        );
        $update->execute([
            $keyword,
            $location,
            $targetLimit,
            $interval,
            (int) $existing['id'],
        ]);
        return (int) $existing['id'];
    }

    $insert = $pdo->prepare(
        "INSERT INTO lead_harvest_jobs
         (owner_user_id, keyword, location, category, keyword_norm, location_norm, target_limit, run_interval_minutes, enabled, status, next_run_at)
         VALUES
         (?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', NOW())"
    );

    $insert->execute([
        $ownerUserId,
        $keyword,
        $location,
        $category,
        $keywordNorm,
        $locationNorm,
        $targetLimit,
        $interval,
    ]);

    return (int) $pdo->lastInsertId();
}

function autonomousKeywordSeeds()
{
    return [
        ['keyword' => 'plumbers', 'category' => 'home_services'],
        ['keyword' => 'plumbing companies', 'category' => 'home_services'],
        ['keyword' => 'electricians', 'category' => 'home_services'],
        ['keyword' => 'electrical contractors', 'category' => 'home_services'],
        ['keyword' => 'hvac contractors', 'category' => 'home_services'],
        ['keyword' => 'roofing contractors', 'category' => 'home_services'],
        ['keyword' => 'roofing companies', 'category' => 'home_services'],
        ['keyword' => 'tree service companies', 'category' => 'home_services'],
        ['keyword' => 'general contractors', 'category' => 'home_services'],
        ['keyword' => 'concrete contractors', 'category' => 'home_services'],
        ['keyword' => 'fence companies', 'category' => 'home_services'],
        ['keyword' => 'landscaping companies', 'category' => 'home_services'],
        ['keyword' => 'landscaping services', 'category' => 'home_services'],
        ['keyword' => 'lawn care services', 'category' => 'home_services'],
        ['keyword' => 'pressure washing companies', 'category' => 'home_services'],
        ['keyword' => 'gutter installation companies', 'category' => 'home_services'],
        ['keyword' => 'solar installation companies', 'category' => 'home_services'],
        ['keyword' => 'garage door repair companies', 'category' => 'home_services'],
        ['keyword' => 'pest control', 'category' => 'home_services'],
        ['keyword' => 'security camera installation companies', 'category' => 'home_services'],
        ['keyword' => 'pool cleaning services', 'category' => 'home_services'],
        ['keyword' => 'pool builders', 'category' => 'home_services'],
        ['keyword' => 'masons', 'category' => 'home_services'],
        ['keyword' => 'carpenters', 'category' => 'home_services'],
        ['keyword' => 'auto repair shops', 'category' => 'automotive'],
        ['keyword' => 'independent auto repair shops', 'category' => 'automotive'],
        ['keyword' => 'collision repair', 'category' => 'automotive'],
        ['keyword' => 'car detailing', 'category' => 'automotive'],
        ['keyword' => 'mobile car detailers', 'category' => 'automotive'],
        ['keyword' => 'mobile mechanics', 'category' => 'automotive'],
        ['keyword' => 'towing companies', 'category' => 'automotive'],
        ['keyword' => 'moving companies', 'category' => 'local_services'],
        ['keyword' => 'dumpster rental companies', 'category' => 'local_services'],
        ['keyword' => 'roll-off waste companies', 'category' => 'local_services'],
        ['keyword' => 'commercial cleaning companies', 'category' => 'local_services'],
        ['keyword' => 'photographers', 'category' => 'local_services'],
        ['keyword' => 'dentists', 'category' => 'healthcare'],
        ['keyword' => 'chiropractors', 'category' => 'healthcare'],
        ['keyword' => 'home care agencies', 'category' => 'healthcare'],
        ['keyword' => 'non-emergency medical transportation', 'category' => 'healthcare'],
        ['keyword' => 'medical courier services', 'category' => 'healthcare'],
        ['keyword' => 'assisted living facilities', 'category' => 'healthcare'],
        ['keyword' => 'daycare centers', 'category' => 'education'],
        ['keyword' => 'small private schools', 'category' => 'education'],
        ['keyword' => 'churches', 'category' => 'community'],
        ['keyword' => 'funeral homes', 'category' => 'community'],
        ['keyword' => 'physical therapy clinics', 'category' => 'healthcare'],
        ['keyword' => 'family law attorneys', 'category' => 'legal'],
        ['keyword' => 'personal injury attorneys', 'category' => 'legal'],
        ['keyword' => 'accounting firms', 'category' => 'finance'],
        ['keyword' => 'local insurance agencies', 'category' => 'finance'],
        ['keyword' => 'tax preparation services', 'category' => 'finance'],
        ['keyword' => 'bail bond companies', 'category' => 'finance'],
        ['keyword' => 'bookkeeping services', 'category' => 'finance'],
        ['keyword' => 'real estate agents', 'category' => 'real_estate'],
        ['keyword' => 'property management companies', 'category' => 'real_estate'],
        ['keyword' => 'mold remediation companies', 'category' => 'restoration'],
        ['keyword' => 'water damage restoration companies', 'category' => 'restoration'],
        ['keyword' => 'fire restoration companies', 'category' => 'restoration'],
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
    $houstonAreaSeeds = [
        'Houston, TX',
        'Downtown Houston, TX',
        'Midtown Houston, TX',
        'Uptown Houston, TX',
        'Galleria Houston, TX',
        'Energy Corridor Houston, TX',
        'Memorial Houston, TX',
        'Westchase Houston, TX',
        'River Oaks Houston, TX',
        'Montrose Houston, TX',
        'Museum District Houston, TX',
        'Medical Center Houston, TX',
        'Heights Houston, TX',
        'Spring Branch Houston, TX',
        'Garden Oaks Houston, TX',
        'Oak Forest Houston, TX',
        'Aldine Houston, TX',
        'Greenspoint Houston, TX',
        'Willowbrook Houston, TX',
        'Katy Houston, TX',
        'Meyerland Houston, TX',
        'Bellaire Houston, TX',
        'West University Houston, TX',
        'Alief Houston, TX',
        'Chinatown Houston, TX',
        'Gulfton Houston, TX',
        'Upper Kirby Houston, TX',
        'East End Houston, TX',
        'EaDo Houston, TX',
        'Third Ward Houston, TX',
        'Sunnyside Houston, TX',
        'Southwest Houston, TX',
        'West Houston, TX',
        'Northwest Houston, TX',
        'Northeast Houston, TX',
        'Southeast Houston, TX',
        'Clear Lake Houston, TX',
        'Pearland Houston, TX',
        'Pasadena Houston, TX',
        'Channelview Houston, TX',
        'Deer Park Houston, TX',
        'Baytown Houston, TX',
        'Humble Houston, TX',
        'Kingwood Houston, TX',
        'Spring Houston, TX',
        'The Woodlands Houston, TX',
        'Conroe Houston, TX',
        'Tomball Houston, TX',
        'Cypress Houston, TX',
        'Missouri City Houston, TX',
        'Sugar Land Houston, TX',
        'Stafford Houston, TX',
        'Richmond Houston, TX',
        'Fulshear Houston, TX',
        'League City Houston, TX',
        'Texas City Houston, TX',
        'Galveston Houston, TX',
        'Piney Point Houston, TX',
    ];

    $texasCities = [
        'Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi',
        'Plano', 'Lubbock', 'Laredo', 'Irving', 'Garland', 'Frisco', 'McKinney', 'Amarillo', 'Grand Prairie',
        'Brownsville', 'Pasadena', 'Killeen', 'McAllen', 'Mesquite', 'Denton', 'Waco', 'Carrollton', 'Midland',
        'Abilene', 'Beaumont', 'Round Rock', 'Odessa', 'Wichita Falls', 'Richardson', 'Lewisville', 'Tyler',
        'College Station', 'Pearland', 'San Angelo', 'Allen', 'League City', 'Sugar Land', 'Longview',
        'Edinburg', 'Mission', 'Bryan', 'Pharr', 'Baytown', 'Temple', 'Missouri City', 'Flower Mound',
        'Harlingen', 'North Richland Hills', 'Victoria', 'Conroe', 'New Braunfels', 'Mansfield', 'Cedar Park',
        'Rowlett', 'Georgetown', 'Pflugerville', 'Port Arthur', 'Euless', 'DeSoto', 'San Marcos', 'Grapevine',
        'Bedford', 'Galveston', 'Coppell', 'Texas City', 'Katy', 'Cypress', 'The Woodlands', 'Huntsville',
        'Sherman', 'Texarkana', 'Haltom City', 'Burleson', 'Keller', 'Rockwall', 'Lancaster', 'Harker Heights',
        'Little Elm', 'Wylie', 'Duncanville', 'Cleburne', 'Friendswood', 'La Porte', 'Nacogdoches', 'Uvalde',
        'Del Rio', 'Seguin', 'Schertz', 'Kyle', 'Leander', 'Bastrop', 'Buda', 'Forney', 'Waxahachie',
        'Southlake', 'Colleyville', 'Farmers Branch', 'Addison', 'Balch Springs', 'Ennis', 'Corsicana',
        'Greenville', 'Denison', 'Paris', 'Stephenville', 'Granbury', 'Weatherford', 'Aledo', 'Mineral Wells',
        'Lake Jackson', 'Freeport', 'Rosenberg', 'Richmond', 'Kerrville', 'Boerne', 'New Caney', 'Spring',
        'Atascocita', 'Humble', 'Kingwood', 'Canyon', 'Pampa', 'Borger', 'Hereford', 'Plainview', 'Levelland',
        'Big Spring', 'Andrews', 'Fort Stockton', 'Eagle Pass', 'Rio Grande City', 'Weslaco', 'Mercedes',
        'San Juan', 'Alamo', 'Donna', 'La Feria', 'Port Isabel', 'South Padre Island', 'Alice', 'Kingsville',
        'Portland', 'Rockport', 'Aransas Pass', 'Fulshear', 'Mont Belvieu', 'Bellville', 'Sealy', 'Brenham',
        'Navasota', 'Caldwell', 'Madisonville', 'Sulphur Springs', 'Mount Pleasant', 'Marshall', 'Kilgore',
        'Henderson', 'Jacksonville', 'Palestine', 'Lufkin', 'Crockett', 'Livingston', 'Liberty', 'Dayton',
        'Carthage', 'Center', 'Athens', 'Terrell', 'Canton', 'Mineola', 'Lindale', 'Whitehouse', 'Bowie',
        'Decatur', 'Gainesville', 'Sanger', 'Prosper', 'Celina', 'Melissa', 'Princeton', 'Anna', 'Aubrey',
        'Murphy', 'Sachse', 'Heath', 'Fate', 'Royse City', 'Benbrook', 'Saginaw', 'Azle', 'Midlothian',
        'Crowley', 'Granite Shoals', 'Burnet', 'Marble Falls', 'Liberty Hill', 'Bee Cave', 'Lakeway', 'Dripping Springs',
        'Fredericksburg', 'Hutto', 'Taylor', 'Elgin', 'Lockhart', 'Luling', 'Gonzales', 'Cuero', 'Beeville',
        'Pleasanton', 'Floresville', 'Pearsall', 'Carrizo Springs', 'Crystal City', 'Brady', 'Brownwood',
        'Lampasas', 'Killeen', 'Belton', 'Hewitt', 'Woodway', 'Mexia', 'Groesbeck', 'Robstown', 'Sinton',
        'Yoakum', 'Wharton', 'El Campo', 'Bay City', 'Clute', 'Angleton', 'Needville', 'Willis', 'Magnolia',
        'Tomball', 'Jersey Village', 'Stafford', 'Bellaire', 'West University Place', 'Channelview',
    ];

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

    $houstonSeeds = [];
    foreach ($houstonAreaSeeds as $seed) {
        $seed = trim((string) $seed);
        if ($seed === '') {
            continue;
        }
        $houstonSeeds[] = $seed;
    }
    $houstonSeeds[] = 'Houston Metro, TX';
    $houstonSeeds[] = 'Houston Area, TX';

    $texasSeeds = [];
    foreach ($texasCities as $city) {
        $city = trim((string) $city);
        if ($city === '') {
            continue;
        }
        $texasSeeds[] = "{$city}, TX";
    }
    if (function_exists('getStateCityShards')) {
        $txShards = getStateCityShards('TX');
        foreach ((array) $txShards as $shard) {
            $shard = trim((string) $shard);
            if ($shard !== '') {
                $texasSeeds[] = $shard;
            }
        }
    }
    $texasSeeds[] = 'Texas, US';
    $texasSeeds[] = 'TX, US';

    $nonTexasSeeds = [];
    foreach ($stateToAnchorCity as $stateCode => $city) {
        if ($stateCode === 'TX') {
            continue;
        }
        $nonTexasSeeds[] = "{$city}, {$stateCode}";
    }

    // Add state-wide targets so every U.S. state can still be covered when needed.
    foreach ($stateNames as $stateCode => $stateName) {
        if ($stateCode === 'TX') {
            continue;
        }
        $nonTexasSeeds[] = "{$stateName}, US";
        $nonTexasSeeds[] = "{$stateCode}, US";

        if (function_exists('getStateCityShards')) {
            $shards = getStateCityShards($stateCode);
            foreach ((array) $shards as $shard) {
                $shard = trim((string) $shard);
                if ($shard !== '') {
                    $nonTexasSeeds[] = $shard;
                }
            }
        }
    }

    $uniqueHouston = [];
    $seen = [];
    foreach ($houstonSeeds as $seed) {
        $normalized = normalizeIndexValue($seed);
        if ($normalized === '' || isset($seen[$normalized])) {
            continue;
        }
        $seen[$normalized] = true;
        $uniqueHouston[] = $seed;
    }
    if (defined('LEAD_HARVEST_HOUSTON_SEED_LIMIT')) {
        $maxHouston = max(1, (int) LEAD_HARVEST_HOUSTON_SEED_LIMIT);
        if (count($uniqueHouston) > $maxHouston) {
            $uniqueHouston = array_slice($uniqueHouston, 0, $maxHouston);
        }
    }

    if (LEAD_HARVEST_HOUSTON_ONLY_MODE) {
        return $uniqueHouston;
    }

    $uniqueTexas = [];
    foreach ($texasSeeds as $seed) {
        $normalized = normalizeIndexValue($seed);
        if ($normalized === '' || isset($seen[$normalized])) {
            continue;
        }
        $seen[$normalized] = true;
        $uniqueTexas[] = $seed;
    }
    if (defined('LEAD_HARVEST_TEXAS_CITY_SEED_LIMIT')) {
        $maxTexas = max(1, (int) LEAD_HARVEST_TEXAS_CITY_SEED_LIMIT);
        if (count($uniqueTexas) > $maxTexas) {
            $uniqueTexas = array_slice($uniqueTexas, 0, $maxTexas);
        }
    }

    if (LEAD_HARVEST_TEXAS_ONLY_MODE) {
        return array_merge($uniqueHouston, $uniqueTexas);
    }

    $uniqueNonTexas = [];
    foreach ($nonTexasSeeds as $seed) {
        $normalized = normalizeIndexValue($seed);
        if ($normalized === '' || isset($seen[$normalized])) {
            continue;
        }
        $seen[$normalized] = true;
        $uniqueNonTexas[] = $seed;
    }
    if (defined('LEAD_HARVEST_NON_TEXAS_SEED_LIMIT')) {
        $maxNonTexas = max(0, (int) LEAD_HARVEST_NON_TEXAS_SEED_LIMIT);
        if ($maxNonTexas === 0) {
            $uniqueNonTexas = [];
        } elseif (count($uniqueNonTexas) > $maxNonTexas) {
            $uniqueNonTexas = array_slice($uniqueNonTexas, 0, $maxNonTexas);
        }
    }

    if (LEAD_HARVEST_TEXAS_FOCUS_MODE) {
        return array_merge($uniqueHouston, $uniqueTexas, $uniqueNonTexas);
    }

    return array_merge($uniqueNonTexas, $uniqueHouston, $uniqueTexas);
}

function isTexasLocationSeed($location)
{
    $norm = normalizeIndexValue($location);
    if ($norm === '') {
        return false;
    }
    if (strpos($norm, ' tx') !== false || strpos($norm, ' texas') !== false) {
        return true;
    }
    return $norm === 'tx us' || $norm === 'texas us';
}

function isHoustonLocationSeed($location)
{
    $norm = normalizeIndexValue($location);
    if ($norm === '') {
        return false;
    }
    return strpos($norm, 'houston') !== false;
}

function splitAutonomousLocationPools(array $locationPool)
{
    $houston = [];
    $texas = [];
    $other = [];
    foreach ($locationPool as $location) {
        if (isHoustonLocationSeed($location)) {
            $houston[] = $location;
        } elseif (isTexasLocationSeed($location)) {
            $texas[] = $location;
        } else {
            $other[] = $location;
        }
    }
    return [
        'houston' => $houston,
        'texas' => $texas,
        'other' => $other,
    ];
}

function shouldPreferHoustonLocation($tick)
{
    if (!LEAD_HARVEST_HOUSTON_FOCUS_MODE && !LEAD_HARVEST_HOUSTON_ONLY_MODE) {
        return false;
    }

    $percent = clampInt((int) LEAD_HARVEST_HOUSTON_PRIORITY_PERCENT, 0, 100);
    if (LEAD_HARVEST_HOUSTON_ONLY_MODE || $percent >= 100) {
        return true;
    }
    if ($percent <= 0) {
        return false;
    }

    $bucket = ((int) $tick) % 100;
    return $bucket < $percent;
}

function shouldPreferTexasLocation($tick)
{
    if (!LEAD_HARVEST_TEXAS_FOCUS_MODE && !LEAD_HARVEST_TEXAS_ONLY_MODE) {
        return false;
    }

    $percent = clampInt((int) LEAD_HARVEST_TEXAS_PRIORITY_PERCENT, 0, 100);
    if (LEAD_HARVEST_TEXAS_ONLY_MODE || $percent >= 100) {
        return true;
    }
    if ($percent <= 0) {
        return false;
    }

    $bucket = ((int) $tick) % 100;
    return $bucket < $percent;
}

function pickAutonomousLocation(array $locationPools, $tick)
{
    $houstonPool = (array) ($locationPools['houston'] ?? []);
    $texasPool = (array) ($locationPools['texas'] ?? []);
    $otherPool = (array) ($locationPools['other'] ?? []);

    $preferHouston = shouldPreferHoustonLocation($tick);
    if ($preferHouston && !empty($houstonPool)) {
        return $houstonPool[((int) $tick) % count($houstonPool)];
    }

    $preferTexas = shouldPreferTexasLocation($tick);
    if ($preferTexas && !empty($texasPool)) {
        return $texasPool[((int) $tick) % count($texasPool)];
    }
    if (!empty($otherPool)) {
        return $otherPool[((int) $tick) % count($otherPool)];
    }
    if (!empty($texasPool)) {
        return $texasPool[((int) $tick) % count($texasPool)];
    }
    if (!empty($houstonPool)) {
        return $houstonPool[((int) $tick) % count($houstonPool)];
    }

    return '';
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

    $dueStmt = $pdo->query(
        "SELECT COUNT(*) AS c
         FROM lead_harvest_jobs
         WHERE enabled = 1
           AND status IN ('pending', 'completed', 'failed')
           AND next_run_at <= NOW()"
    );
    $dueCount = (int) (($dueStmt->fetch(PDO::FETCH_ASSOC)['c'] ?? 0));
    if ($dueCount >= max(10, (int) LEAD_HARVEST_AUTONOMOUS_MAX_DUE_JOBS)) {
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

    $keywordPool = [];
    foreach ($keywords as $seed) {
        $keyword = trim((string) ($seed['keyword'] ?? ''));
        $category = trim((string) ($seed['category'] ?? 'general'));
        if ($keyword === '') {
            continue;
        }
        $keywordPool[] = [
            'keyword' => $keyword,
            'category' => $category,
        ];
    }
    $locationPool = [];
    foreach ($locations as $location) {
        $location = trim((string) $location);
        if ($location === '') {
            continue;
        }
        $locationPool[] = $location;
    }
    if (empty($keywordPool) || empty($locationPool)) {
        return 0;
    }

    // Balanced round-robin over keywords so inserted jobs are not skewed to a single keyword.
    $keywordCount = count($keywordPool);
    $locationPools = splitAutonomousLocationPools($locationPool);
    $locationCount = count($locationPool);
    $seedTick = (int) floor(time() / 300);
    $maxCandidateSteps = min($keywordCount * $locationCount, max(200, $slots * 30));

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
    for ($step = 0; $step < $maxCandidateSteps; $step++) {
        if ($inserted >= $slots) {
            break;
        }

        $kwIdx = ($seedTick + $step) % $keywordCount;
        $locationTick = ((int) floor($seedTick / max(1, $keywordCount)) + $step);
        $pickedLocation = pickAutonomousLocation($locationPools, $locationTick);
        if ($pickedLocation === '') {
            continue;
        }
        $combo = [
            'keyword' => $keywordPool[$kwIdx]['keyword'],
            'category' => $keywordPool[$kwIdx]['category'],
            'location' => $pickedLocation,
        ];

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

function runDirectAutonomousBatch(PDO &$pdo, $batchSize)
{
    $batchSize = max(1, (int) $batchSize);
    $keywords = autonomousKeywordSeeds();
    $locations = autonomousLocationSeeds();
    if (empty($keywords) || empty($locations)) {
        return 0;
    }

    $processed = 0;
    $keywordCount = count($keywords);
    $locationPool = [];
    foreach ($locations as $location) {
        $location = trim((string) $location);
        if ($location !== '') {
            $locationPool[] = $location;
        }
    }
    $locationPools = splitAutonomousLocationPools($locationPool);
    $seedTick = (int) floor(time() / 300);

    for ($i = 0; $i < $batchSize; $i++) {
        if (!ensurePdoAlive($pdo, "direct_batch_iter_{$i}")) {
            workerLog('Direct batch stopping early: DB connection unavailable');
            break;
        }

        $kwIdx = ($seedTick + $i) % $keywordCount;
        $locationTick = (($seedTick * 7) + ($i * 13));
        $pickedLocation = pickAutonomousLocation($locationPools, $locationTick);

        $seed = $keywords[$kwIdx];
        $keyword = trim((string) ($seed['keyword'] ?? ''));
        $category = trim((string) ($seed['category'] ?? 'general'));
        $location = trim((string) $pickedLocation);
        if ($keyword === '' || $location === '') {
            continue;
        }

        $jobPayload = [
            'keyword' => $keyword,
            'location' => $location,
            'category' => $category,
            'limit' => (int) LEAD_HARVEST_AUTONOMOUS_DEFAULT_LIMIT,
            'interval' => (int) LEAD_HARVEST_AUTONOMOUS_INTERVAL_MINUTES,
        ];

        try {
            $jobId = upsertHarvestJobFromCli($pdo, $jobPayload);
        } catch (Throwable $e) {
            if (isMysqlGoneAwayException($e) && reconnectPdo($pdo, "direct_batch_upsert_{$i}")) {
                try {
                    $jobId = upsertHarvestJobFromCli($pdo, $jobPayload);
                } catch (Throwable $retryError) {
                    workerLog("Direct batch upsert failed after reconnect: " . $retryError->getMessage());
                    continue;
                }
            } else {
                workerLog("Direct batch upsert failed: " . $e->getMessage());
                continue;
            }
        }
        if ($jobId <= 0) {
            continue;
        }

        try {
            $forcedJob = acquireDueJob($pdo, $jobId);
        } catch (Throwable $e) {
            if (isMysqlGoneAwayException($e) && reconnectPdo($pdo, "direct_batch_acquire_{$jobId}")) {
                try {
                    $forcedJob = acquireDueJob($pdo, $jobId);
                } catch (Throwable $retryError) {
                    workerLog("Direct batch acquire failed after reconnect for job #{$jobId}: " . $retryError->getMessage());
                    continue;
                }
            } else {
                workerLog("Direct batch acquire failed for job #{$jobId}: " . $e->getMessage());
                continue;
            }
        }
        if (!$forcedJob) {
            continue;
        }

        try {
            $result = processHarvestJob($pdo, $forcedJob);
            $processed++;
            workerLog(sprintf(
                'Direct batch job #%d (%s | %s) done: discovered=%d touched_records=%d runtime=%dms',
                (int) $forcedJob['id'],
                (string) ($forcedJob['keyword'] ?? ''),
                (string) ($forcedJob['location'] ?? ''),
                (int) ($result['discovered_count'] ?? 0),
                (int) ($result['record_count'] ?? 0),
                (int) ($result['runtime_ms'] ?? 0)
            ));
        } catch (Throwable $e) {
            $error = $e->getMessage();
            workerLog("Direct batch job #{$jobId} failed: {$error}");
            try {
                markHarvestJobFailed($pdo, $jobId, $error);
            } catch (Throwable $markError) {
                if (
                    isMysqlGoneAwayException($markError) &&
                    reconnectPdo($pdo, "direct_batch_mark_failed_{$jobId}")
                ) {
                    try {
                        markHarvestJobFailed($pdo, $jobId, $error);
                    } catch (Throwable $retryMarkError) {
                        workerLog("Direct batch failed marking job #{$jobId} after reconnect: " . $retryMarkError->getMessage());
                    }
                } else {
                    workerLog("Direct batch failed marking job #{$jobId}: " . $markError->getMessage());
                }
            }
        }
    }

    return $processed;
}

function processHarvestJob(PDO &$pdo, array $job)
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

    $leads = [];
    $primaryError = null;
    try {
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
    } catch (Throwable $e) {
        $primaryError = $e->getMessage();
        workerLog("Job #{$jobId} primary discovery failed, switching to fallback: {$primaryError}");
    }

    // Strong fallback matrix for better volume if primary failed or returned very low.
    $lowYieldThreshold = max(8, (int) ceil($targetLimit * 0.15));
    if (count($leads) < $lowYieldThreshold) {
        $needed = max(0, $targetLimit - count($leads));
        if ($needed > 0) {
            $fallbackLeads = runNoKeyFallbackMatrix($keyword, $location, min($targetLimit, $needed + 40));
            if (!empty($fallbackLeads)) {
                if (function_exists('customFetcherEnrichLeads')) {
                    $timeout = function_exists('customFetcherContactTimeout') ? (int) customFetcherContactTimeout() : 6;
                    $concurrency = function_exists('customFetcherEnrichConcurrency') ? (int) customFetcherEnrichConcurrency() : 4;
                    $fallbackLeads = customFetcherEnrichLeads($fallbackLeads, max(3, $timeout), max(1, min(6, $concurrency)));
                }
                $seen = [];
                foreach ($leads as $lead) {
                    if (!is_array($lead)) {
                        continue;
                    }
                    $k = buildBusinessDedupeKey($lead, $location);
                    $seen[$k] = true;
                }
                foreach ($fallbackLeads as $lead) {
                    if (!is_array($lead)) {
                        continue;
                    }
                    $k = buildBusinessDedupeKey($lead, $location);
                    if (isset($seen[$k])) {
                        continue;
                    }
                    $seen[$k] = true;
                    $leads[] = $lead;
                    if (count($leads) >= $targetLimit) {
                        break;
                    }
                }
            }
        }
    }

    $locationParts = parseLocationParts($location);
    $cityFromJob = $locationParts['city'];
    $stateFromJob = $locationParts['state'];

    $websiteSignalsCache = [];
    $deepScrapeBudget = (int) LEAD_HARVEST_DEEP_SCRAPE_MAX_PER_JOB;
    $deepScrapeUsed = 0;
    $touchedRecordIds = [];

    if (!ensurePdoAlive($pdo, "job_{$jobId}_before_persist")) {
        throw new RuntimeException("Job #{$jobId} cannot persist leads: DB reconnect failed");
    }

    foreach ($leads as $lead) {
        if (!is_array($lead)) {
            continue;
        }

        try {
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
        } catch (Throwable $persistError) {
            if (
                isMysqlGoneAwayException($persistError) &&
                reconnectPdo($pdo, "job_{$jobId}_persist")
            ) {
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
            } else {
                throw $persistError;
            }
        }

        if ($persisted !== null) {
            $touchedRecordIds[$persisted] = true;
        }
    }

    $recordCount = count($touchedRecordIds);
    if ($recordCount > 0) {
        $nextRunAt = gmdate('Y-m-d H:i:s', time() + ($intervalMinutes * 60));
        $doneSql =
            "UPDATE lead_harvest_jobs
             SET status = 'completed',
                 last_finished_at = NOW(),
                 next_run_at = :next_run_at,
                 last_result_count = :last_result_count,
                 total_result_count = total_result_count + :last_result_count,
                 last_error = NULL,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id";
        $doneParams = [
            'next_run_at' => $nextRunAt,
            'last_result_count' => $recordCount,
            'id' => $jobId,
        ];
        try {
            $done = $pdo->prepare($doneSql);
            $done->execute($doneParams);
        } catch (Throwable $doneError) {
            if (
                isMysqlGoneAwayException($doneError) &&
                reconnectPdo($pdo, "job_{$jobId}_complete")
            ) {
                $done = $pdo->prepare($doneSql);
                $done->execute($doneParams);
            } else {
                throw $doneError;
            }
        }
    } else {
        $reason = $primaryError ? ('No records persisted; primary error: ' . $primaryError) : 'No records persisted from discovery/fallback.';
        workerLog("Job #{$jobId} produced zero persisted records. discovered=" . count($leads));
        try {
            markHarvestJobFailed($pdo, $jobId, $reason);
        } catch (Throwable $failError) {
            if (
                isMysqlGoneAwayException($failError) &&
                reconnectPdo($pdo, "job_{$jobId}_no_records")
            ) {
                markHarvestJobFailed($pdo, $jobId, $reason);
            } else {
                throw $failError;
            }
        }
    }

    return [
        'job_id' => $jobId,
        'discovered_count' => count($leads),
        'record_count' => $recordCount,
        'runtime_ms' => (int) round((microtime(true) - $startedAt) * 1000),
    ];
}

function runNoKeyFallbackMatrix($keyword, $location, $targetLimit)
{
    if (!function_exists('customFetcherSearchNoKey')) {
        return [];
    }

    $targetLimit = max(20, min(400, (int) $targetLimit));
    $maxQueries = max(4, (int) LEAD_HARVEST_FALLBACK_QUERY_MAX);

    $queries = [];
    $baseKeyword = trim((string) $keyword);
    $baseLocation = trim((string) $location);
    if ($baseKeyword !== '' && $baseLocation !== '') {
        $queries[] = "{$baseKeyword} in {$baseLocation}";
        $queries[] = "{$baseKeyword} {$baseLocation}";
        $queries[] = "{$baseKeyword} near {$baseLocation}";
        $queries[] = "{$baseKeyword} company {$baseLocation}";
        $queries[] = "{$baseKeyword} service {$baseLocation}";
    }

    if (function_exists('expandServiceSynonyms') && $baseKeyword !== '') {
        $synonyms = array_slice((array) expandServiceSynonyms($baseKeyword), 0, 10);
        foreach ($synonyms as $synonym) {
            $synonym = trim((string) $synonym);
            if ($synonym === '') {
                continue;
            }
            if ($baseLocation !== '') {
                $queries[] = "{$synonym} in {$baseLocation}";
            } else {
                $queries[] = $synonym;
            }
        }
    }

    if (function_exists('buildLocationExpansions') && $baseKeyword !== '' && $baseLocation !== '') {
        $locations = array_slice((array) buildLocationExpansions($baseLocation), 0, 10);
        foreach ($locations as $loc) {
            $loc = trim((string) $loc);
            if ($loc === '') {
                continue;
            }
            $queries[] = "{$baseKeyword} in {$loc}";
        }
    }

    $unique = [];
    $seenQueries = [];
    foreach ($queries as $q) {
        $q = trim(preg_replace('/\s+/', ' ', (string) $q));
        $key = normalizeIndexValue($q);
        if ($q === '' || $key === '' || isset($seenQueries[$key])) {
            continue;
        }
        $seenQueries[$key] = true;
        $unique[] = $q;
        if (count($unique) >= $maxQueries) {
            break;
        }
    }

    $results = [];
    $seenLeads = [];
    $perQueryLimit = max(20, min(100, (int) ceil($targetLimit / max(1, count($unique))) + 10));
    foreach ($unique as $query) {
        $found = customFetcherSearchNoKey($query, $perQueryLimit);
        foreach ((array) $found as $lead) {
            if (!is_array($lead)) {
                continue;
            }
            $k = buildBusinessDedupeKey($lead, $location);
            if (isset($seenLeads[$k])) {
                continue;
            }
            $seenLeads[$k] = true;
            $results[] = $lead;
            if (count($results) >= $targetLimit) {
                break 2;
            }
        }
    }

    return $results;
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
        'raw_payload' => safeJsonEncode($lead),
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

function getDbConnection()
{
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
    return new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function buildBusinessDedupeKey($lead, $location = '')
{
    $name = normalizeIndexValue((string) ($lead['name'] ?? $lead['business_name'] ?? ''));
    $url = extractDomain((string) ($lead['url'] ?? $lead['website'] ?? ''));
    $phone = preg_replace('/\D+/', '', (string) ($lead['phone'] ?? ''));
    $address = normalizeIndexValue((string) ($lead['address'] ?? ''));
    $loc = normalizeIndexValue((string) $location);
    return hash('sha256', implode('|', [$name, $url, $phone, $address, $loc]));
}

function customFetcherContactTimeout()
{
    return max(3, (int) LEAD_HARVEST_DEEP_SCRAPE_TIMEOUT_SEC);
}

function customFetcherEnrichConcurrency()
{
    return 4;
}

function customFetcherSearchAndEnrich($service, $location, $limit, $filters, $filtersActive, $targetCount, $onStatus = null, $onBatch = null)
{
    $limit = max(20, min((int) LEAD_HARVEST_MAX_LIMIT_PER_JOB, (int) $limit));
    $queries = workerBuildSearchQueries($service, $location, $limit);
    if (empty($queries)) {
        $queries = [trim((string) $service . ' ' . (string) $location)];
    }

    $results = [];
    $seen = [];
    $perQueryLimit = max(20, min((int) LEAD_HARVEST_NO_KEY_PER_QUERY_LIMIT, (int) ceil($limit / max(1, count($queries))) + 10));

    foreach ($queries as $idx => $query) {
        if (count($results) >= $limit) {
            break;
        }
        if (is_callable($onStatus)) {
            $onStatus([
                'phase' => 'discover',
                'message' => 'Discovering leads',
                'queryIndex' => $idx + 1,
                'queryTotal' => count($queries),
                'query' => $query,
            ]);
        }
        $found = customFetcherSearchNoKey($query, $perQueryLimit);
        foreach ($found as $lead) {
            if (!is_array($lead)) {
                continue;
            }
            $key = buildBusinessDedupeKey($lead, $location);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $results[] = $lead;
            if (count($results) >= $limit) {
                break;
            }
        }
    }

    return array_slice($results, 0, $limit);
}

function customFetcherEnrichLeads($leads, $timeout, $concurrency)
{
    $timeout = max(3, (int) $timeout);
    $out = [];
    foreach ((array) $leads as $lead) {
        if (!is_array($lead)) {
            continue;
        }
        $url = normalizeUrlValue((string) ($lead['url'] ?? $lead['website'] ?? ''));
        if ($url === '') {
            $out[] = $lead;
            continue;
        }

        $signals = scrapeWebsiteForContacts($url, $timeout);
        $email = trim((string) ($lead['email'] ?? ''));
        if ($email === '' && !empty($signals['emails'])) {
            $email = (string) $signals['emails'][0];
        }
        $phone = normalizePhone((string) ($lead['phone'] ?? ''));
        if ($phone === '' && !empty($signals['phones'])) {
            $phone = normalizePhone((string) $signals['phones'][0]);
        }

        $lead['email'] = $email;
        $lead['phone'] = $phone;
        $lead['enrichment'] = [
            'emails' => array_values(array_unique((array) ($signals['emails'] ?? []))),
            'phones' => array_values(array_unique((array) ($signals['phones'] ?? []))),
            'socials' => (array) ($signals['socials'] ?? []),
        ];
        $out[] = $lead;
    }
    return $out;
}

function customFetcherSearchNoKey($query, $limit)
{
    $limit = max(5, min(200, (int) $limit));
    $timeout = max(3, (int) LEAD_HARVEST_NO_KEY_TIMEOUT_SEC);

    $providers = [
        [
            'name' => 'duckduckgo',
            'url' => 'https://duckduckgo.com/html/?q=' . urlencode((string) $query),
            'parser' => 'workerParseDuckDuckGoHtml',
        ],
        [
            'name' => 'bing',
            'url' => 'https://www.bing.com/search?q=' . urlencode((string) $query),
            'parser' => 'workerParseBingHtml',
        ],
        [
            'name' => 'startpage',
            'url' => 'https://www.startpage.com/do/dsearch?query=' . urlencode((string) $query) . '&cat=web&language=english',
            'parser' => 'workerParseGenericSearchHtml',
        ],
        [
            'name' => 'yahoo',
            'url' => 'https://search.yahoo.com/search?p=' . urlencode((string) $query),
            'parser' => 'workerParseGenericSearchHtml',
        ],
    ];

    $results = [];
    $seen = [];

    foreach ($providers as $provider) {
        $resp = curlRequest($provider['url'], [], $timeout);
        $httpCode = (int) ($resp['httpCode'] ?? 0);
        if ($httpCode < 200 || $httpCode >= 300) {
            continue;
        }
        $html = (string) ($resp['response'] ?? '');
        if ($html === '') {
            continue;
        }
        $rows = call_user_func($provider['parser'], $html, $limit);
        if (empty($rows)) {
            $rows = workerParseGenericSearchHtml($html, $limit);
        }
        foreach ($rows as $row) {
            $biz = workerNormalizeDiscoveryRow($row, $provider['name']);
            if ($biz === null) {
                continue;
            }
            $key = buildBusinessDedupeKey($biz, '');
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $results[] = $biz;
            if (count($results) >= $limit) {
                break 2;
            }
        }
    }

    return $results;
}

function workerBuildSearchQueries($service, $location, $limit)
{
    $service = trim((string) $service);
    $location = trim((string) $location);
    $queries = [];

    if ($service !== '' && $location !== '') {
        $queries[] = "{$service} in {$location}";
        $queries[] = "{$service} {$location}";
        $queries[] = "{$service} near {$location}";
        $queries[] = "{$service} company {$location}";
    }

    foreach (expandServiceSynonyms($service) as $synonym) {
        $synonym = trim((string) $synonym);
        if ($synonym === '') {
            continue;
        }
        if ($location !== '') {
            $queries[] = "{$synonym} in {$location}";
        } else {
            $queries[] = $synonym;
        }
    }

    foreach (buildLocationExpansions($location) as $loc) {
        $loc = trim((string) $loc);
        if ($loc === '' || $service === '') {
            continue;
        }
        $queries[] = "{$service} in {$loc}";
    }

    $unique = [];
    $seen = [];
    $maxQueries = max(8, (int) LEAD_HARVEST_NO_KEY_MAX_QUERIES_PER_JOB);
    foreach ($queries as $q) {
        $q = trim(preg_replace('/\s+/', ' ', (string) $q));
        $k = normalizeIndexValue($q);
        if ($q === '' || $k === '' || isset($seen[$k])) {
            continue;
        }
        $seen[$k] = true;
        $unique[] = $q;
        if (count($unique) >= $maxQueries) {
            break;
        }
    }

    return $unique;
}

function expandServiceSynonyms($service)
{
    $service = trim((string) $service);
    if ($service === '') {
        return [];
    }

    $map = [
        'plumbers' => ['plumbing contractor', 'plumbing service', 'emergency plumber'],
        'electricians' => ['electrical contractor', 'electrical service'],
        'hvac contractors' => ['hvac service', 'air conditioning repair', 'heating repair'],
        'roofing companies' => ['roofing contractor', 'roof repair'],
        'dentists' => ['dental clinic', 'family dentist', 'cosmetic dentist'],
        'marketing agencies' => ['digital marketing agency', 'seo agency', 'ppc agency'],
    ];

    $norm = normalizeIndexValue($service);
    $out = [$service];
    foreach ($map as $key => $synonyms) {
        if (normalizeIndexValue($key) === $norm) {
            foreach ($synonyms as $s) {
                $out[] = $s;
            }
            break;
        }
    }

    if (substr($service, -1) === 's') {
        $out[] = rtrim($service, 's');
    } else {
        $out[] = $service . 's';
    }

    return array_values(array_unique(array_filter($out)));
}

function buildLocationExpansions($location)
{
    $location = trim((string) $location);
    if ($location === '') {
        return [];
    }

    $out = [$location];
    $parts = parseLocationParts($location);
    $city = trim((string) ($parts['city'] ?? ''));
    $state = trim((string) ($parts['state'] ?? ''));
    if ($city !== '') {
        $out[] = "{$city} downtown";
        $out[] = "{$city} metro";
    }
    if ($state !== '') {
        $out[] = "{$state}, US";
    }

    return array_values(array_unique(array_filter($out)));
}

function workerNormalizeDiscoveryRow($row, $source)
{
    $title = trim((string) ($row['title'] ?? $row['name'] ?? ''));
    $link = workerDecodeResultUrl((string) ($row['link'] ?? $row['url'] ?? ''));
    if ($link === '' || !workerIsLikelyBusinessUrl($link)) {
        return null;
    }
    if ($title === '') {
        $host = strtolower((string) parse_url($link, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host);
        $title = $host !== '' ? ucwords(str_replace(['-', '.'], ' ', $host)) : 'Unknown Business';
    }

    $snippet = trim((string) ($row['snippet'] ?? ''));
    $emails = extractEmails($snippet);
    $phones = extractPhoneNumbers($snippet);

    return [
        'id' => substr(hash('sha1', strtolower($title . '|' . $link)), 0, 24),
        'name' => $title,
        'business_name' => $title,
        'url' => $link,
        'website' => $link,
        'email' => $emails[0] ?? '',
        'phone' => $phones[0] ?? '',
        'address' => '',
        'source' => 'lead_harvest_' . $source,
        'enrichment' => [
            'emails' => $emails,
            'phones' => $phones,
            'socials' => [],
        ],
    ];
}

function workerDecodeResultUrl($url)
{
    $url = trim(html_entity_decode((string) $url, ENT_QUOTES | ENT_HTML5));
    if ($url === '') {
        return '';
    }
    if (strpos($url, '//') === 0) {
        $url = 'https:' . $url;
    }

    $parsed = parse_url($url);
    if ($parsed && !empty($parsed['host'])) {
        $host = strtolower((string) $parsed['host']);
        parse_str((string) ($parsed['query'] ?? ''), $query);
        if (strpos($host, 'duckduckgo.com') !== false && !empty($query['uddg'])) {
            $url = urldecode((string) $query['uddg']);
        } elseif (strpos($host, 'bing.com') !== false && !empty($query['u'])) {
            // Bing sometimes returns redirect URLs in "u=a1<base64url>" format.
            $u = (string) $query['u'];
            if (strpos($u, 'a1') === 0) {
                $payload = substr($u, 2);
                $payload = strtr($payload, '-_', '+/');
                $padding = strlen($payload) % 4;
                if ($padding > 0) {
                    $payload .= str_repeat('=', 4 - $padding);
                }
                $decoded = base64_decode($payload, true);
                if (is_string($decoded) && preg_match('/^https?:\/\//i', $decoded)) {
                    $url = $decoded;
                }
            }
        } elseif ((strpos($host, 'google.') !== false || strpos($host, 'bing.com') !== false) && !empty($query['q'])) {
            $candidate = urldecode((string) $query['q']);
            if (preg_match('/^https?:\/\//i', $candidate)) {
                $url = $candidate;
            }
        }
    }

    if (!preg_match('/^https?:\/\//i', $url)) {
        return '';
    }
    return filter_var($url, FILTER_VALIDATE_URL) ? $url : '';
}

function workerIsLikelyBusinessUrl($url)
{
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    if ($host === '') {
        return false;
    }

    $blocked = [
        'duckduckgo.com',
        'bing.com',
        'google.com',
        'maps.google.com',
        'webcache.googleusercontent.com',
        'translate.google.com',
    ];
    foreach ($blocked as $domain) {
        if ($host === $domain || substr($host, -strlen('.' . $domain)) === '.' . $domain) {
            return false;
        }
    }

    $path = strtolower((string) parse_url($url, PHP_URL_PATH));
    $blockedExt = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.zip'];
    foreach ($blockedExt as $ext) {
        if ($path !== '' && substr($path, -strlen($ext)) === $ext) {
            return false;
        }
    }

    return true;
}

function workerParseDuckDuckGoHtml($html, $limit)
{
    if (!is_string($html) || $html === '') {
        return [];
    }
    $results = [];
    preg_match_all('/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/is', $html, $matches, PREG_SET_ORDER);
    if (empty($matches)) {
        preg_match_all('/<h2[^>]*>.*?<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>.*?<\/h2>/is', $html, $matches, PREG_SET_ORDER);
    }
    foreach ($matches as $match) {
        if (count($results) >= $limit) {
            break;
        }
        $results[] = [
            'link' => (string) ($match[1] ?? ''),
            'title' => trim(html_entity_decode(strip_tags((string) ($match[2] ?? '')), ENT_QUOTES | ENT_HTML5)),
            'snippet' => '',
        ];
    }
    return $results;
}

function workerParseBingHtml($html, $limit)
{
    if (!is_string($html) || $html === '') {
        return [];
    }
    $results = [];
    preg_match_all('/<li[^>]+class="[^"]*b_algo[^"]*"[^>]*>.*?<h2[^>]*><a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a><\/h2>.*?(?:<p>(.*?)<\/p>)?/is', $html, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        if (count($results) >= $limit) {
            break;
        }
        $results[] = [
            'link' => (string) ($match[1] ?? ''),
            'title' => trim(html_entity_decode(strip_tags((string) ($match[2] ?? '')), ENT_QUOTES | ENT_HTML5)),
            'snippet' => trim(html_entity_decode(strip_tags((string) ($match[3] ?? '')), ENT_QUOTES | ENT_HTML5)),
        ];
    }
    return $results;
}

function workerParseGenericSearchHtml($html, $limit)
{
    if (!is_string($html) || $html === '') {
        return [];
    }

    $results = [];
    $seen = [];
    preg_match_all('/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/is', $html, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        if (count($results) >= $limit) {
            break;
        }
        $href = workerDecodeResultUrl((string) ($match[1] ?? ''));
        if ($href === '' || !workerIsLikelyBusinessUrl($href)) {
            continue;
        }
        $title = trim(html_entity_decode(strip_tags((string) ($match[2] ?? '')), ENT_QUOTES | ENT_HTML5));
        $key = strtolower($href);
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $results[] = [
            'link' => $href,
            'title' => $title,
            'snippet' => '',
        ];
    }

    return $results;
}

function curlRequest($url, $curlOptions = [], $timeoutSec = 6)
{
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => (string) $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => max(2, min(6, (int) $timeoutSec)),
        CURLOPT_TIMEOUT => max(3, (int) $timeoutSec),
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; BamLeadHarvester/1.0)',
        CURLOPT_HTTPHEADER => [
            'Accept-Language: en-US,en;q=0.9',
        ],
    ]);
    if (!empty($curlOptions)) {
        curl_setopt_array($ch, $curlOptions);
    }

    $response = curl_exec($ch);
    $result = [
        'response' => is_string($response) ? $response : '',
        'httpCode' => (int) curl_getinfo($ch, CURLINFO_HTTP_CODE),
        'errorNo' => (int) curl_errno($ch),
        'error' => (string) curl_error($ch),
        'effectiveUrl' => (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL),
    ];
    curl_close($ch);
    return $result;
}

function extractEmails($text)
{
    if (!is_string($text) || $text === '') {
        return [];
    }
    preg_match_all('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,63}/i', $text, $matches);
    $emails = [];
    foreach ((array) ($matches[0] ?? []) as $email) {
        $email = strtolower(trim((string) $email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            continue;
        }
        if (strpos($email, 'example.com') !== false) {
            continue;
        }
        $emails[] = $email;
    }
    return array_values(array_unique($emails));
}

function extractPhoneNumbers($text)
{
    if (!is_string($text) || $text === '') {
        return [];
    }
    preg_match_all('/(?:\+?1[\s\-.]?)?(?:\(?\d{3}\)?[\s\-.]?)\d{3}[\s\-.]?\d{4}/', $text, $matches);
    $phones = [];
    foreach ((array) ($matches[0] ?? []) as $match) {
        $phone = normalizePhone($match);
        if ($phone !== '') {
            $phones[] = $phone;
        }
    }
    return array_values(array_unique($phones));
}

function customFetcherExtractSocials($html)
{
    if (!is_string($html) || $html === '') {
        return [];
    }
    $patterns = [
        'facebook' => '/https?:\/\/(?:www\.)?facebook\.com\/[^\s"\'>]+/i',
        'linkedin' => '/https?:\/\/(?:www\.)?linkedin\.com\/[^\s"\'>]+/i',
        'instagram' => '/https?:\/\/(?:www\.)?instagram\.com\/[^\s"\'>]+/i',
        'youtube' => '/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s"\'>]+/i',
    ];
    $socials = [];
    foreach ($patterns as $platform => $pattern) {
        if (preg_match($pattern, $html, $m)) {
            $socials[$platform] = $m[0];
        }
    }
    return $socials;
}

function scrapeWebsiteForContacts($websiteUrl, $timeoutSec = 6)
{
    $websiteUrl = normalizeUrlValue((string) $websiteUrl);
    if ($websiteUrl === '') {
        return ['emails' => [], 'phones' => [], 'socials' => []];
    }

    $targets = [
        $websiteUrl,
        rtrim($websiteUrl, '/') . '/contact',
        rtrim($websiteUrl, '/') . '/contact-us',
        rtrim($websiteUrl, '/') . '/about',
        rtrim($websiteUrl, '/') . '/about-us',
    ];

    $emails = [];
    $phones = [];
    $socials = [];
    $seen = [];

    foreach ($targets as $url) {
        $url = normalizeUrlValue($url);
        if ($url === '' || isset($seen[$url])) {
            continue;
        }
        $seen[$url] = true;

        $resp = curlRequest($url, [CURLOPT_SSL_VERIFYPEER => false], max(3, (int) $timeoutSec));
        $httpCode = (int) ($resp['httpCode'] ?? 0);
        if ($httpCode < 200 || $httpCode >= 400) {
            continue;
        }
        $html = (string) ($resp['response'] ?? '');
        if ($html === '') {
            continue;
        }

        $emails = array_merge($emails, extractEmails($html));
        $phones = array_merge($phones, extractPhoneNumbers($html));
        $socials = array_merge($socials, customFetcherExtractSocials($html));
    }

    return [
        'emails' => array_values(array_unique($emails)),
        'phones' => array_values(array_unique($phones)),
        'socials' => $socials,
    ];
}
