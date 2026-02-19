<?php
// api/config.php
// Configuration is loaded from environment variables and .env files.
// Precedence: process env -> $_ENV/$_SERVER -> .env files -> fallback defaults.

function load_env_map(): array {
    static $env = null;
    if ($env !== null) {
        return $env;
    }

    $env = [];
    $files = [
        __DIR__ . '/.env',
        __DIR__ . '/.env.local',
        dirname(__DIR__) . '/.env',
        dirname(__DIR__) . '/.env.local',
    ];

    foreach ($files as $file) {
        if (!is_readable($file)) {
            continue;
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            continue;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (str_starts_with($line, 'export ')) {
                $line = trim(substr($line, 7));
            }

            $eq = strpos($line, '=');
            if ($eq === false) {
                continue;
            }

            $key = trim(substr($line, 0, $eq));
            if ($key === '') {
                continue;
            }

            $value = trim(substr($line, $eq + 1));
            $isDoubleQuoted = str_starts_with($value, '"') && str_ends_with($value, '"');
            $isSingleQuoted = str_starts_with($value, "'") && str_ends_with($value, "'");
            if ($isDoubleQuoted || $isSingleQuoted) {
                $value = substr($value, 1, -1);
            }

            $value = str_replace(['\n', '\r', '\t'], ["\n", "\r", "\t"], $value);
            if (!array_key_exists($key, $env)) {
                $env[$key] = $value;
            }
        }
    }

    return $env;
}

function env_value(string $key, ?string $default = null): ?string {
    $runtime = getenv($key);
    if ($runtime !== false) {
        return (string)$runtime;
    }

    if (isset($_ENV[$key])) {
        return (string)$_ENV[$key];
    }

    if (isset($_SERVER[$key])) {
        return (string)$_SERVER[$key];
    }

    $env = load_env_map();
    if (array_key_exists($key, $env)) {
        return $env[$key];
    }

    return $default;
}

function env_first(array $keys, ?string $default = null): ?string {
    foreach ($keys as $key) {
        $value = env_value($key, null);
        if ($value !== null && trim($value) !== '') {
            return $value;
        }
    }
    return $default;
}

function env_csv(array $keys, array $default = []): array {
    $raw = env_first($keys, null);
    if ($raw === null || trim($raw) === '') {
        return $default;
    }

    return array_values(array_filter(
        array_map('trim', explode(',', $raw)),
        static fn($value) => $value !== ''
    ));
}

function normalize_dir(?string $value, string $fallback): string {
    $resolved = trim((string)$value);
    if ($resolved === '') {
        $resolved = $fallback;
    }
    return rtrim($resolved, '/') . '/';
}

function normalize_url(?string $value, string $fallback): string {
    $resolved = trim((string)$value);
    if ($resolved === '') {
        $resolved = $fallback;
    }
    return rtrim($resolved, '/') . '/';
}

$defaultUploadDir = '/home/username/public_html/uploads/';
$defaultUploadUrl = 'https://yourdomain.com/uploads/';
$defaultStagingDir = '/data/staging/';
$defaultProdDir = '/data/prod/';
$defaultStagingUrl = 'https://yourdomain.com/data/staging/';
$defaultProdUrl = 'https://yourdomain.com/data/prod/';

define('DB_HOST', env_first(['API_DB_HOST', 'DB_HOST'], 'localhost'));
define('DB_NAME', env_first(['API_DB_NAME', 'DB_NAME'], 'your_db_name'));
define('DB_USER', env_first(['API_DB_USER', 'DB_USER'], 'your_db_user'));
define('DB_PASS', env_first(['API_DB_PASS', 'DB_PASS'], 'your_db_pass'));

define('SUPABASE_JWT_SECRET', env_first(
    ['API_SUPABASE_JWT_SECRET', 'SUPABASE_JWT_SECRET'],
    'your-supabase-jwt-secret'
));

define('UPLOAD_DIR', normalize_dir(
    env_first(['API_UPLOAD_DIR', 'UPLOAD_DIR'], $defaultUploadDir),
    $defaultUploadDir
));
define('UPLOAD_URL', normalize_url(
    env_first(['API_UPLOAD_URL', 'UPLOAD_URL'], $defaultUploadUrl),
    $defaultUploadUrl
));

define('STAGING_UPLOAD_DIR', normalize_dir(
    env_first(['API_STAGING_UPLOAD_DIR', 'STAGING_UPLOAD_DIR'], $defaultStagingDir),
    $defaultStagingDir
));
define('PROD_UPLOAD_DIR', normalize_dir(
    env_first(['API_PROD_UPLOAD_DIR', 'PROD_UPLOAD_DIR'], $defaultProdDir),
    $defaultProdDir
));
define('STAGING_UPLOAD_URL', normalize_url(
    env_first(['API_STAGING_UPLOAD_URL', 'STAGING_UPLOAD_URL'], $defaultStagingUrl),
    $defaultStagingUrl
));
define('PROD_UPLOAD_URL', normalize_url(
    env_first(['API_PROD_UPLOAD_URL', 'PROD_UPLOAD_URL'], $defaultProdUrl),
    $defaultProdUrl
));

define('ALLOWED_ORIGINS', env_csv(
    ['API_ALLOWED_ORIGINS', 'ALLOWED_ORIGINS'],
    ['http://localhost:5173', 'https://yourdomain.com']
));
