<?php
// api/routes/images.php
$user = require_auth(); // All image ops need auth
$prodBaseDir = rtrim(defined('PROD_UPLOAD_DIR') ? PROD_UPLOAD_DIR : (UPLOAD_DIR . 'data/prod/'), '/') . '/';
$prodBaseUrl = rtrim(defined('PROD_UPLOAD_URL') ? PROD_UPLOAD_URL : (UPLOAD_URL . 'data/prod/'), '/') . '/';

if ($method === 'POST') {
    if (empty($_FILES['image'])) {
        json_response(['error' => 'No file uploaded'], 400);
    }

    $entity_type = $_POST['entity_type'] ?? 'article';
    $entity_id   = $_POST['entity_id'] ?? null;
    $alt_text    = $_POST['alt_text'] ?? '';
    $role        = $_POST['role'] ?? 'gallery';

    $file = $_FILES['image'];
    $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];

    if (!in_array($ext, $allowed)) {
        json_response(['error' => 'File type not allowed: ' . $ext], 400);
    }

    // Max 10MB
    if ($file['size'] > 10 * 1024 * 1024) {
        json_response(['error' => 'File too large (max 10MB)'], 400);
    }

    $filename = uniqid() . '_' . time() . '.' . $ext;
    $isArticleEntity = $entity_type === 'article';
    $dir = $isArticleEntity ? $prodBaseDir : (rtrim(UPLOAD_DIR, '/') . '/' . $entity_type . '/');

    if (!is_dir($dir)) mkdir($dir, 0755, true);

    if (!move_uploaded_file($file['tmp_name'], $dir . $filename)) {
        json_response(['error' => 'Upload failed'], 500);
    }

    $url = $isArticleEntity
        ? ($prodBaseUrl . $filename)
        : (rtrim(UPLOAD_URL, '/') . '/' . $entity_type . '/' . $filename);

    $db = get_db();
    $stmt = $db->prepare("INSERT INTO images (filename, url, alt_text, role, entity_type, entity_id) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$filename, $url, $alt_text, $role, $entity_type, $entity_id]);

    json_response(['url' => $url, 'id' => (int)$db->lastInsertId()], 201);
}

if ($method === 'GET') {
    $db = get_db();
    $entity_type = $_GET['entity_type'] ?? null;
    $entity_id = $_GET['entity_id'] ?? null;
    $sql = "SELECT * FROM images WHERE 1=1";
    $params = [];
    if ($entity_type) { $sql .= " AND entity_type = ?"; $params[] = $entity_type; }
    if ($entity_id) { $sql .= " AND entity_id = ?"; $params[] = $entity_id; }
    $sql .= " ORDER BY sort_order ASC, uploaded_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    json_response($stmt->fetchAll());
}

if ($method === 'DELETE') {
    if (!$id) json_response(['error' => 'ID required'], 400);
    $db = get_db();
    $stmt = $db->prepare("SELECT filename, entity_type FROM images WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetch();

    if ($img) {
        $filepath = ($img['entity_type'] ?? '') === 'article'
            ? ($prodBaseDir . $img['filename'])
            : (rtrim(UPLOAD_DIR, '/') . '/' . $img['entity_type'] . '/' . $img['filename']);
        if (file_exists($filepath)) @unlink($filepath);
        $db->prepare("DELETE FROM images WHERE id = ?")->execute([$id]);
    }
    json_response(['deleted' => true]);
}

json_response(['error' => 'Method not allowed'], 405);
