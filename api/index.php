<?php
// api/index.php — Entry point
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/db.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/slug.php';
require_once __DIR__ . '/auth.php';

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$segments = explode('/', $uri);

// Strip 'api' prefix if present
if (($segments[0] ?? '') === 'api') array_shift($segments);

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;

match($resource) {
    'articles'       => require __DIR__ . '/routes/articles.php',
    'events'         => require __DIR__ . '/routes/events.php',
    'destinations'   => require __DIR__ . '/routes/destinations.php',
    'images'         => require __DIR__ . '/routes/images.php',
    'staging'        => require __DIR__ . '/routes/staging.php',
    'staging-images' => require __DIR__ . '/routes/staging-images.php',
    'health'         => json_response(['status' => 'ok', 'time' => date('c'), 'jwt_set' => SUPABASE_JWT_SECRET !== 'your-supabase-jwt-secret', 'jwt_len' => strlen(SUPABASE_JWT_SECRET)]),
    default          => json_response(['error' => 'Not found'], 404),
};
