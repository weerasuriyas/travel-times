<?php
// api/routes/staging.php
$user = require_auth();
$userId = $user['sub'] ?? ($user['user_id'] ?? null);
$db = get_db();

$stagingBaseDir = rtrim(defined('STAGING_UPLOAD_DIR') ? STAGING_UPLOAD_DIR : (UPLOAD_DIR . 'data/staging/'), '/') . '/';
$stagingBaseUrl = rtrim(defined('STAGING_UPLOAD_URL') ? STAGING_UPLOAD_URL : (UPLOAD_URL . 'data/staging/'), '/') . '/';
$prodBaseDir = rtrim(defined('PROD_UPLOAD_DIR') ? PROD_UPLOAD_DIR : (UPLOAD_DIR . 'data/prod/'), '/') . '/';
$prodBaseUrl = rtrim(defined('PROD_UPLOAD_URL') ? PROD_UPLOAD_URL : (UPLOAD_URL . 'data/prod/'), '/') . '/';

function normalize_review_status(?string $status): string {
    $allowed = ['pending', 'approved', 'rejected'];
    $candidate = strtolower(trim((string)$status));
    return in_array($candidate, $allowed, true) ? $candidate : 'pending';
}

function normalize_article_status(?string $status): string {
    $allowed = ['draft', 'published'];
    $candidate = strtolower(trim((string)$status));
    return in_array($candidate, $allowed, true) ? $candidate : 'draft';
}

function build_unique_article_slug(PDO $db, string $base): string {
    $slug = slugify($base);
    if ($slug === '') { $slug = 'article'; }
    $candidate = $slug;
    $counter = 2;
    $stmt = $db->prepare("SELECT id FROM articles WHERE slug = ? LIMIT 1");
    while (true) {
        $stmt->execute([$candidate]);
        if (!$stmt->fetch()) { return $candidate; }
        $candidate = $slug . '-' . $counter;
        $counter++;
    }
}

function build_unique_staging_folder(string $baseDir, string $base): string {
    $folder = slugify($base);
    if ($folder === '') { $folder = 'article'; }
    $candidate = $folder;
    $counter = 2;
    while (is_dir($baseDir . $candidate)) {
        $candidate = $folder . '-' . $counter;
        $counter++;
    }
    return $candidate;
}

function read_staging_json(string $baseDir, string $folder): ?array {
    $path = $baseDir . $folder . '/article.json';
    if (!is_file($path)) return null;
    $raw = file_get_contents($path);
    if ($raw === false) return null;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function write_staging_json(string $baseDir, string $folder, array $data): void {
    file_put_contents(
        $baseDir . $folder . '/article.json',
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
    );
}

function staging_list_item(array $data): array {
    return [
        'folder'         => $data['folder'] ?? '',
        'title'          => $data['title'] ?? '',
        'slug'           => $data['slug'] ?? '',
        'review_status'  => $data['review_status'] ?? 'pending',
        'image_count'    => count($data['images'] ?? []),
        'submitted_at'   => $data['submitted_at'] ?? null,
        'desired_status' => $data['desired_status'] ?? 'draft',
    ];
}

if ($method === 'GET') {
    if ($id) {
        // GET /staging/{folder}
        $folder = $id;
        $data = read_staging_json($stagingBaseDir, $folder);
        if ($data === null) {
            json_response(['error' => 'Not found'], 404);
        }

        $article = null;
        if (!empty($data['final_article_id'])) {
            $articleStmt = $db->prepare("SELECT * FROM articles WHERE id = ?");
            $articleStmt->execute([(int)$data['final_article_id']]);
            $article = $articleStmt->fetch() ?: null;
        }

        json_response([
            'staging'         => $data,
            'images'          => $data['images'] ?? [],
            'article'         => $article,
            'approved_images' => [],
        ]);
    }

    // GET /staging — scan filesystem
    $reviewStatus = $_GET['review_status'] ?? null;

    if (!is_dir($stagingBaseDir)) {
        json_response([]);
    }

    $items = [];
    foreach (scandir($stagingBaseDir) as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        if (!is_dir($stagingBaseDir . $entry)) continue;

        $data = read_staging_json($stagingBaseDir, $entry);
        if ($data === null) continue;

        if ($reviewStatus && ($data['review_status'] ?? '') !== normalize_review_status($reviewStatus)) {
            continue;
        }

        $items[] = staging_list_item($data);
    }

    usort($items, fn($a, $b) => strcmp($b['submitted_at'] ?? '', $a['submitted_at'] ?? ''));
    json_response($items);
}

if ($method === 'POST') {
    // POST /staging/{folder}/approve
    if ($id && $action === 'approve') {
        $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        $reviewNotes = trim((string)($payload['review_notes'] ?? ''));
        $forcedStatus = null;
        if (isset($payload['status']) && $payload['status'] !== '') {
            $forcedStatus = normalize_article_status($payload['status']);
        }

        $folder = $id;
        $staged = read_staging_json($stagingBaseDir, $folder);

        if ($staged === null) {
            json_response(['error' => 'Staging record not found'], 404);
        }
        if (($staged['review_status'] ?? '') !== 'pending') {
            json_response(['error' => 'Only pending staging records can be approved'], 409);
        }

        try {
            $db->beginTransaction();

            $destinationId = null;
            if (!empty($staged['destination_slug'])) {
                $destStmt = $db->prepare("SELECT id FROM destinations WHERE slug = ? LIMIT 1");
                $destStmt->execute([$staged['destination_slug']]);
                $dest = $destStmt->fetch();
                $destinationId = $dest ? (int)$dest['id'] : null;
            }

            $eventId = null;
            if (!empty($staged['event_slug'])) {
                $eventStmt = $db->prepare("SELECT id FROM events WHERE slug = ? LIMIT 1");
                $eventStmt->execute([$staged['event_slug']]);
                $event = $eventStmt->fetch();
                $eventId = $event ? (int)$event['id'] : null;
            }

            $articleStatus = $forcedStatus ?? normalize_article_status($staged['desired_status'] ?? 'draft');
            $publishedAt = $articleStatus === 'published' ? date('Y-m-d H:i:s') : null;
            $slugSource = !empty($staged['slug']) ? $staged['slug'] : ($staged['title'] ?? 'article');
            $articleSlug = build_unique_article_slug($db, $slugSource);

            $insertArticle = $db->prepare("INSERT INTO articles
                (event_id, destination_id, slug, title, subtitle, category, tags, issue,
                 author_name, author_role, read_time, body, status, published_at, cover_image)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $insertArticle->execute([
                $eventId,
                $destinationId,
                $articleSlug,
                $staged['title'],
                $staged['subtitle'] ?? null,
                $staged['category'] ?? null,
                json_encode($staged['tags'] ?? []),
                $staged['issue'] ?? null,
                $staged['author_name'] ?? 'Editorial Team',
                $staged['author_role'] ?? null,
                $staged['read_time'] ?? null,
                $staged['body'] ?? '',
                $articleStatus,
                $publishedAt,
                null,
            ]);
            $articleId = (int)$db->lastInsertId();

            $coverImage = null;
            $createdImages = 0;

            foreach ($staged['images'] ?? [] as $img) {
                $storedFilename = $img['stored_filename'] ?? '';
                if (!$storedFilename) continue;

                $oldPath = $stagingBaseDir . $folder . '/' . $storedFilename;
                if (!file_exists($oldPath)) continue;

                $ext = strtolower(pathinfo($storedFilename, PATHINFO_EXTENSION));
                $newFilename = 'article_' . bin2hex(random_bytes(8)) . '_' . time() . ($ext ? '.' . $ext : '');
                $newAbsolutePath = $prodBaseDir . $newFilename;

                if (!is_dir($prodBaseDir) && !mkdir($prodBaseDir, 0755, true) && !is_dir($prodBaseDir)) {
                    throw new RuntimeException('Could not create prod upload directory');
                }

                if (!@rename($oldPath, $newAbsolutePath)) {
                    if (!@copy($oldPath, $newAbsolutePath)) {
                        throw new RuntimeException('Could not move staged image: ' . $storedFilename);
                    }
                    @unlink($oldPath);
                }

                $newUrl = $prodBaseUrl . $newFilename;
                $db->prepare("INSERT INTO images
                    (filename, url, alt_text, role, entity_type, entity_id, sort_order)
                    VALUES (?,?,?,?,?,?,?)")->execute([
                    $newFilename,
                    $newUrl,
                    $img['alt_text'] ?? '',
                    $img['role'] ?? 'gallery',
                    'article',
                    $articleId,
                    $img['sort_order'] ?? 0,
                ]);

                if ($coverImage === null && in_array($img['role'] ?? '', ['hero', 'cover'], true)) {
                    $coverImage = $newUrl;
                }
                $createdImages++;
            }

            if ($coverImage !== null) {
                $db->prepare("UPDATE articles SET cover_image = ? WHERE id = ?")->execute([$coverImage, $articleId]);
            }

            $db->commit();

            // Update article.json
            $staged['review_status']   = 'approved';
            $staged['review_notes']    = $reviewNotes !== '' ? $reviewNotes : null;
            $staged['reviewed_by']     = $userId;
            $staged['reviewed_at']     = date('c');
            $staged['final_article_id']= $articleId;
            write_staging_json($stagingBaseDir, $folder, $staged);

            json_response([
                'approved'     => true,
                'folder'       => $folder,
                'article_id'   => $articleId,
                'article_slug' => $articleSlug,
                'image_count'  => $createdImages,
            ]);
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            json_response(['error' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    // POST /staging/{folder}/reject
    if ($id && $action === 'reject') {
        $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        $reviewNotes = trim((string)($payload['review_notes'] ?? ''));

        $folder = $id;
        $staged = read_staging_json($stagingBaseDir, $folder);

        if ($staged === null) {
            json_response(['error' => 'Staging record not found'], 404);
        }
        if (($staged['review_status'] ?? '') !== 'pending') {
            json_response(['error' => 'Only pending staging records can be rejected'], 409);
        }

        $staged['review_status'] = 'rejected';
        $staged['review_notes']  = $reviewNotes !== '' ? $reviewNotes : null;
        $staged['reviewed_by']   = $userId;
        $staged['reviewed_at']   = date('c');
        write_staging_json($stagingBaseDir, $folder, $staged);

        json_response(['rejected' => true, 'folder' => $folder]);
    }

    if ($id) {
        json_response(['error' => 'Invalid staging action'], 400);
    }

    // POST /staging — create new staging record
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['title'])) {
        json_response(['error' => 'title is required'], 400);
    }

    $folderBase = !empty($data['folder_name']) ? $data['folder_name']
        : (!empty($data['slug']) ? $data['slug'] : $data['title']);
    $folder = build_unique_staging_folder($stagingBaseDir, $folderBase);

    $tags = $data['tags'] ?? [];
    if (is_string($tags)) {
        $tags = array_values(array_filter(array_map('trim', explode(',', $tags))));
    }

    $slug = !empty($data['slug']) ? slugify($data['slug']) : slugify($data['title']);
    $slug = $slug ?: slugify('staging-' . time());
    $desiredStatus = normalize_article_status($data['status'] ?? $data['desired_status'] ?? 'draft');

    $articleJson = [
        'folder'           => $folder,
        'title'            => $data['title'],
        'slug'             => $slug,
        'subtitle'         => $data['subtitle'] ?? null,
        'category'         => $data['category'] ?? null,
        'tags'             => $tags,
        'issue'            => $data['issue'] ?? null,
        'author_name'      => $data['author_name'] ?? 'Editorial Team',
        'author_role'      => $data['author_role'] ?? null,
        'read_time'        => $data['read_time'] ?? null,
        'destination_slug' => $data['destination'] ?? $data['destination_slug'] ?? null,
        'event_slug'       => $data['event_slug'] ?? null,
        'body'             => $data['body'] ?? '',
        'desired_status'   => $desiredStatus,
        'submitted_by'     => $userId,
        'review_status'    => 'pending',
        'submitted_at'     => date('c'),
        'reviewed_by'      => null,
        'review_notes'     => null,
        'reviewed_at'      => null,
        'final_article_id' => null,
        'images'           => [],
    ];

    $dir = $stagingBaseDir . $folder . '/';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        json_response(['error' => 'Could not create staging directory'], 500);
    }

    write_staging_json($stagingBaseDir, $folder, $articleJson);

    json_response([
        'folder'        => $folder,
        'slug'          => $slug,
        'review_status' => 'pending',
    ], 201);
}

json_response(['error' => 'Method not allowed'], 405);
