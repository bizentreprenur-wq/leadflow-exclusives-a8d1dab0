<?php
/**
 * Social Search Preview API
 *
 * Returns public search result snippets for blocked social platforms
 * (e.g. Facebook, LinkedIn) so the UI can still show useful in-app context
 * when iframe embedding is not allowed.
 *
 * Usage: POST { "business_name": "...", "location": "...", "platform": "facebook" }
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: application/json');
setCorsHeaders();
handlePreflight();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getJsonInput();
$businessName = isset($input['business_name']) ? sanitizeInput($input['business_name'], 200) : '';
$location = isset($input['location']) ? sanitizeInput($input['location'], 200) : '';
$platformInput = isset($input['platform']) ? strtolower(sanitizeInput($input['platform'], 50)) : '';

if ($businessName === '') {
    sendError('Business name is required');
}

$platformMap = [
    'facebook' => ['domain' => 'facebook.com', 'label' => 'Facebook'],
    'linkedin' => ['domain' => 'linkedin.com', 'label' => 'LinkedIn'],
    'instagram' => ['domain' => 'instagram.com', 'label' => 'Instagram'],
    'youtube' => ['domain' => 'youtube.com', 'label' => 'YouTube'],
    'tiktok' => ['domain' => 'tiktok.com', 'label' => 'TikTok'],
];

if (!isset($platformMap[$platformInput])) {
    sendError('Unsupported platform');
}

if (!defined('SERPER_API_KEY') || trim((string)SERPER_API_KEY) === '') {
    sendError('Social preview search unavailable (SERPER_API_KEY missing)', 503);
}

$cacheKey = 'social_preview_' . md5($businessName . '|' . $location . '|' . $platformInput);
$cached = getCache($cacheKey);
if ($cached !== null) {
    sendJson(array_merge(['success' => true, 'cached' => true], $cached));
}

$domain = $platformMap[$platformInput]['domain'];
$platformLabel = $platformMap[$platformInput]['label'];

$baseQuery = trim($businessName . ' ' . $location);
$queries = [
    "{$baseQuery} site:{$domain}",
    "{$businessName} site:{$domain}",
];

if ($platformInput === 'linkedin') {
    $queries[] = "{$baseQuery} site:linkedin.com/company";
    $queries[] = "{$baseQuery} site:linkedin.com/in";
}

$results = [];
$seen = [];
$errors = [];

foreach ($queries as $query) {
    if (count($results) >= 6) {
        break;
    }

    $response = curlRequest('https://google.serper.dev/search', [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'q' => $query,
            'num' => 8,
        ]),
        CURLOPT_HTTPHEADER => [
            'X-API-KEY: ' . SERPER_API_KEY,
            'Content-Type: application/json',
        ],
    ], 12);

    if ((int)$response['httpCode'] !== 200 || empty($response['response'])) {
        $errors[] = "HTTP {$response['httpCode']}";
        continue;
    }

    $json = json_decode($response['response'], true);
    if (!is_array($json) || empty($json['organic']) || !is_array($json['organic'])) {
        continue;
    }

    foreach ($json['organic'] as $item) {
        if (count($results) >= 6) {
            break;
        }

        $link = isset($item['link']) ? trim((string)$item['link']) : '';
        if ($link === '' || stripos($link, $domain) === false) {
            continue;
        }

        if (!isLikelyBrowsableSocialLink($platformInput, $link)) {
            continue;
        }

        $canonical = strtolower(preg_replace('/[#?].*/', '', $link));
        if (isset($seen[$canonical])) {
            continue;
        }
        $seen[$canonical] = true;

        $title = isset($item['title']) ? trim((string)$item['title']) : $platformLabel . ' Result';
        $snippet = isset($item['snippet']) ? trim((string)$item['snippet']) : '';
        $score = scoreSocialResult($platformInput, $link, $title, $snippet, $businessName, $location);

        $results[] = [
            'title' => $title,
            'snippet' => $snippet,
            'link' => $link,
            'displayLink' => isset($item['displayLink']) ? trim((string)$item['displayLink']) : parse_url($link, PHP_URL_HOST),
            '_score' => $score,
            '_exact' => isExactProfilePath($platformInput, $link),
        ];
    }
}

$fallbackSearchUrl = 'https://www.google.com/search?q=' . urlencode("{$baseQuery} site:{$domain}");

usort($results, function($a, $b) {
    return ($b['_score'] ?? 0) <=> ($a['_score'] ?? 0);
});

$exactProfileUrl = null;
foreach ($results as $result) {
    if (!empty($result['_exact']) && !empty($result['link'])) {
        $exactProfileUrl = $result['link'];
        break;
    }
}

$results = array_slice(array_map(function($row) {
    unset($row['_score'], $row['_exact']);
    return $row;
}, $results), 0, 6);

$payload = [
    'platform' => $platformInput,
    'platformLabel' => $platformLabel,
    'query' => $baseQuery,
    'results' => $results,
    'fallbackSearchUrl' => $fallbackSearchUrl,
    'exactProfileUrl' => $exactProfileUrl,
];

if (!empty($errors) && empty($results)) {
    $payload['warnings'] = array_values(array_unique($errors));
}

setCache($cacheKey, $payload, 21600); // 6h cache

sendJson(array_merge(['success' => true, 'cached' => false], $payload));

function tokenizeForMatch($text) {
    $text = strtolower((string)$text);
    $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
    $parts = preg_split('/\s+/', trim($text));
    $parts = array_filter($parts, function($token) {
        return strlen($token) >= 3;
    });
    return array_values(array_unique($parts));
}

function hasAnyToken($haystack, $tokens) {
    foreach ($tokens as $token) {
        if (strpos($haystack, $token) !== false) {
            return true;
        }
    }
    return false;
}

function isLikelyBrowsableSocialLink($platform, $url) {
    $path = strtolower((string)parse_url($url, PHP_URL_PATH));
    $query = strtolower((string)parse_url($url, PHP_URL_QUERY));
    $joined = trim($path . ' ' . $query);

    $blockedPathFragments = [
        'facebook' => ['/search', '/groups', '/events', '/watch', '/marketplace', '/reel', '/share'],
        'linkedin' => ['/search', '/feed', '/jobs', '/learning', '/school', '/pulse'],
        'instagram' => ['/explore', '/accounts', '/stories', '/reels'],
        'youtube' => ['/results', '/watch', '/shorts', '/playlist'],
        'tiktok' => ['/search', '/discover'],
    ];

    if (!isset($blockedPathFragments[$platform])) {
        return true;
    }

    foreach ($blockedPathFragments[$platform] as $blocked) {
        if (strpos($joined, $blocked) !== false) {
            return false;
        }
    }

    return true;
}

function isExactProfilePath($platform, $url) {
    $path = strtolower((string)parse_url($url, PHP_URL_PATH));
    $query = strtolower((string)parse_url($url, PHP_URL_QUERY));

    if ($platform === 'facebook') {
        if (strpos($path, '/profile.php') !== false && strpos($query, 'id=') !== false) {
            return true;
        }
        // /{slug} style
        return (bool)preg_match('#^/[a-z0-9\.\-_]+/?$#i', $path);
    }

    if ($platform === 'linkedin') {
        return (bool)preg_match('#^/(company|in)/[a-z0-9\-_]+/?$#i', $path);
    }

    if ($platform === 'instagram') {
        return (bool)preg_match('#^/[a-z0-9\._]+/?$#i', $path);
    }

    if ($platform === 'youtube') {
        return strpos($path, '/@') === 0 || strpos($path, '/channel/') === 0 || strpos($path, '/c/') === 0;
    }

    if ($platform === 'tiktok') {
        return strpos($path, '/@') === 0;
    }

    return false;
}

function scoreSocialResult($platform, $url, $title, $snippet, $businessName, $location) {
    $score = 0;
    $titleLower = strtolower((string)$title);
    $snippetLower = strtolower((string)$snippet);
    $haystack = $titleLower . ' ' . $snippetLower;

    if (isExactProfilePath($platform, $url)) {
        $score += 80;
    }

    $businessTokens = tokenizeForMatch($businessName);
    foreach ($businessTokens as $token) {
        if (strpos($haystack, $token) !== false) {
            $score += 8;
        }
    }

    $locationTokens = tokenizeForMatch($location);
    if (hasAnyToken($haystack, $locationTokens)) {
        $score += 10;
    }

    if (strpos($titleLower, 'official') !== false) {
        $score += 8;
    }
    if (strpos($titleLower, 'page') !== false || strpos($titleLower, 'company') !== false) {
        $score += 4;
    }

    return $score;
}
