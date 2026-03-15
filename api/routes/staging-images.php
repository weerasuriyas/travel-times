<?php
// api/routes/staging-images.php
$user = require_auth();

$stagingBaseDir = rtrim(defined('STAGING_UPLOAD_DIR') ? STAGING_UPLOAD_DIR : (UPLOAD_DIR . 'data/staging/'), '/') . '/';
$stagingBaseUrl = rtrim(defined('STAGING_UPLOAD_URL') ? STAGING_UPLOAD_URL : (UPLOAD_URL . 'data/staging/'), '/') . '/';

function read_staging_json_img(string $baseDir, string $folder): ?array {
    $path = $baseDir . $folder . '/article.json';
    if (!is_file($path)) return null;
    $raw = file_get_contents($path);
    if ($raw === false) return null;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function write_staging_json_img(string $baseDir, string $folder, array $data): void {
    file_put_contents(
        $baseDir . $folder . '/article.json',
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
}

function sanitize_folder(string $folder): string {
    return preg_replace('/[^a-zA-Z0-9\-_]/', '', $folder);
}

if ($method === 'POST') {
    if (empty($_FILES['image'])) {
        json_response(['error' => 'No file uploaded'], 400);
    }

    $stagingFolder = sanitize_folder(trim($_POST['staging_folder'] ?? ''));
    if ($stagingFolder === '') {
        json_response(['error' => 'staging_folder is required'], 400);
    }

    $staged = read_staging_json_img($stagingBaseDir, $stagingFolder);
    if ($staged === null) {
        json_response(['error' => 'Staging record not found'], 404);
    }
    if (($staged['review_status'] ?? '') !== 'pending') {
        json_response(['error' => 'Only pending staging records can receive images'], 409);
    }

    $role      = $_POST['role'] ?? 'gallery';
    $altText   = $_POST['alt_text'] ?? '';
    $sortOrder = (int)($_POST['sort_order'] ?? 0);

    $file    = $_FILES['image'];
    $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];

    if (!in_array($ext, $allowed, true)) {
        json_response(['error' => 'File type not allowed: ' . $ext], 400);
    }
    if (($file['size'] ?? 0) > 10 * 1024 * 1024) {
        json_response(['error' => 'File too large (max 10MB)'], 400);
    }

    $folderDir = $stagingBaseDir . $stagingFolder . '/';
    if (!is_dir($folderDir) && !mkdir($folderDir, 0755, true) && !is_dir($folderDir)) {
        json_response(['error' => 'Could not create staging directory'], 500);
    }

    $storedFilename = 'stg_' . bin2hex(random_bytes(8)) . '_' . time() . '.' . $ext;
    $absolutePath   = $folderDir . $storedFilename;

    if (!move_uploaded_file($file['tmp_name'], $absolutePath)) {
        json_response(['error' => 'Upload failed'], 500);
    }

    $url = $stagingBaseUrl . $stagingFolder . '/' . $storedFilename;

    $staged['images'][] = [
        'stored_filename'   => $storedFilename,
        'original_filename' => $file['name'],
        'role'              => $role,
        'alt_text'          => $altText,
        'sort_order'        => $sortOrder,
        'url'               => $url,
    ];
    write_staging_json_img($stagingBaseDir, $stagingFolder, $staged);

    json_response([
        'staging_folder'    => $stagingFolder,
        'stored_filename'   => $storedFilename,
        'original_filename' => $file['name'],
        'url'               => $url,
        'role'              => $role,
        'sort_order'        => $sortOrder,
    ], 201);
}

if ($method === 'GET') {
    $stagingFolder = sanitize_folder(trim($_GET['staging_folder'] ?? ''));
    if ($stagingFolder === '') {
        json_response(['error' => 'staging_folder is required'], 400);
    }
    $staged = read_staging_json_img($stagingBaseDir, $stagingFolder);
    if ($staged === null) {
        json_response(['error' => 'Not found'], 404);
    }
    json_response($staged['images'] ?? []);
}

if ($method === 'DELETE') {
    $stagingFolder = sanitize_folder(trim($_GET['staging_folder'] ?? ''));
    $filename      = basename(trim($_GET['filename'] ?? ''));

    if ($stagingFolder === '' || $filename === '') {
        json_response(['error' => 'staging_folder and filename are required'], 400);
    }

    $staged = read_staging_json_img($stagingBaseDir, $stagingFolder);
    if ($staged !== null) {
        $staged['images'] = array_values(array_filter(
            $staged['images'] ?? [],
            fn($img) => ($img['stored_filename'] ?? '') !== $filename
        ));
        write_staging_json_img($stagingBaseDir, $stagingFolder, $staged);
    }

    $filePath = $stagingBaseDir . $stagingFolder . '/' . $filename;
    if (file_exists($filePath)) {
        @unlink($filePath);
    }

    json_response(['deleted' => true]);
}

json_response(['error' => 'Method not allowed'], 405);
