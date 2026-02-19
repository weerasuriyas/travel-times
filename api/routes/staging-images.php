<?php
// api/routes/staging-images.php
$user = require_auth(); // staging image ops require auth
$db = get_db();

$stagingBaseDir = rtrim(defined('STAGING_UPLOAD_DIR') ? STAGING_UPLOAD_DIR : (UPLOAD_DIR . 'data/staging/'), '/') . '/';
$stagingBaseUrl = rtrim(defined('STAGING_UPLOAD_URL') ? STAGING_UPLOAD_URL : (UPLOAD_URL . 'data/staging/'), '/') . '/';

if ($method === 'POST') {
    if (empty($_FILES['image'])) {
        json_response(['error' => 'No file uploaded'], 400);
    }

    $stagingId = (int)($_POST['staging_id'] ?? 0);
    if ($stagingId <= 0) {
        json_response(['error' => 'staging_id is required'], 400);
    }

    $stagingStmt = $db->prepare("SELECT id, review_status FROM staged_ingestions WHERE id = ?");
    $stagingStmt->execute([$stagingId]);
    $staging = $stagingStmt->fetch();

    if (!$staging) {
        json_response(['error' => 'Staging record not found'], 404);
    }
    if (($staging['review_status'] ?? '') !== 'pending') {
        json_response(['error' => 'Only pending staging records can receive images'], 409);
    }

    $role = $_POST['role'] ?? 'gallery';
    $altText = $_POST['alt_text'] ?? '';
    $sortOrder = (int)($_POST['sort_order'] ?? 0);

    $file = $_FILES['image'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];

    if (!in_array($ext, $allowed, true)) {
        json_response(['error' => 'File type not allowed: ' . $ext], 400);
    }

    // Max 10MB
    if (($file['size'] ?? 0) > 10 * 1024 * 1024) {
        json_response(['error' => 'File too large (max 10MB)'], 400);
    }

    $storageDirRel = 'data/staging/' . $stagingId . '/';
    $storageDirAbs = $stagingBaseDir . $stagingId . '/';
    if (!is_dir($storageDirAbs) && !mkdir($storageDirAbs, 0755, true) && !is_dir($storageDirAbs)) {
        json_response(['error' => 'Could not create staging upload directory'], 500);
    }

    $storedFilename = uniqid('stg_', true) . '_' . time() . '.' . $ext;
    $storagePath = $storageDirRel . $storedFilename;

    $absolutePath = $storageDirAbs . $storedFilename;
    if (!move_uploaded_file($file['tmp_name'], $absolutePath)) {
        json_response(['error' => 'Upload failed'], 500);
    }

    $url = $stagingBaseUrl . $stagingId . '/' . $storedFilename;
    $stmt = $db->prepare("INSERT INTO staged_images
        (staging_id, filename, stored_filename, storage_path, url, alt_text, role, sort_order)
        VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $stagingId,
        $file['name'],
        $storedFilename,
        $storagePath,
        $url,
        $altText,
        $role,
        $sortOrder,
    ]);

    json_response([
        'id' => (int)$db->lastInsertId(),
        'staging_id' => $stagingId,
        'filename' => $file['name'],
        'url' => $url,
        'role' => $role,
        'sort_order' => $sortOrder,
    ], 201);
}

if ($method === 'GET') {
    $stagingId = (int)($_GET['staging_id'] ?? 0);

    if ($stagingId > 0) {
        $stmt = $db->prepare("SELECT * FROM staged_images WHERE staging_id = ? ORDER BY sort_order ASC, uploaded_at ASC");
        $stmt->execute([$stagingId]);
        json_response($stmt->fetchAll());
    }

    $stmt = $db->query("SELECT * FROM staged_images ORDER BY uploaded_at DESC LIMIT 200");
    json_response($stmt->fetchAll());
}

if ($method === 'DELETE') {
    if (!$id) {
        json_response(['error' => 'ID required'], 400);
    }

    $stmt = $db->prepare("SELECT id, staging_id, storage_path FROM staged_images WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetch();

    if (!$img) {
        json_response(['deleted' => true]);
    }

    $filename = basename((string)($img['storage_path'] ?? ''));
    $stagingId = (int)($img['staging_id'] ?? 0);
    $fullPath = $stagingBaseDir . ($stagingId > 0 ? ($stagingId . '/') : '') . $filename;
    if ($filename && file_exists($fullPath)) {
        @unlink($fullPath);
    }

    $db->prepare("DELETE FROM staged_images WHERE id = ?")->execute([$id]);
    json_response(['deleted' => true]);
}

json_response(['error' => 'Method not allowed'], 405);
