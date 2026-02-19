<?php
// api/routes/staging.php
$db = get_db();
$user = require_auth();
$userId = $user['sub'] ?? ($user['user_id'] ?? null);
$prodBaseDir = rtrim(defined('PROD_UPLOAD_DIR') ? PROD_UPLOAD_DIR : (UPLOAD_DIR . 'data/prod/'), '/') . '/';
$prodBaseUrl = rtrim(defined('PROD_UPLOAD_URL') ? PROD_UPLOAD_URL : (UPLOAD_URL . 'data/prod/'), '/') . '/';
$stagingBaseDir = rtrim(defined('STAGING_UPLOAD_DIR') ? STAGING_UPLOAD_DIR : (UPLOAD_DIR . 'data/staging/'), '/') . '/';

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
    if ($slug === '') {
        $slug = 'article';
    }

    $candidate = $slug;
    $counter = 2;
    $stmt = $db->prepare("SELECT id FROM articles WHERE slug = ? LIMIT 1");
    while (true) {
        $stmt->execute([$candidate]);
        if (!$stmt->fetch()) {
            return $candidate;
        }
        $candidate = $slug . '-' . $counter;
        $counter++;
    }
}

if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM staged_ingestions WHERE id = ?");
        $stmt->execute([$id]);
        $staging = $stmt->fetch();
        if (!$staging) {
            json_response(['error' => 'Not found'], 404);
        }

        $imgStmt = $db->prepare("SELECT * FROM staged_images WHERE staging_id = ? ORDER BY sort_order ASC, uploaded_at ASC");
        $imgStmt->execute([$id]);
        $images = $imgStmt->fetchAll();

        $article = null;
        $finalImages = [];
        if (!empty($staging['final_article_id'])) {
            $articleStmt = $db->prepare("SELECT * FROM articles WHERE id = ?");
            $articleStmt->execute([(int)$staging['final_article_id']]);
            $article = $articleStmt->fetch() ?: null;

            $finalImgStmt = $db->prepare("SELECT * FROM images WHERE staging_ingestion_id = ? ORDER BY sort_order ASC, uploaded_at ASC");
            $finalImgStmt->execute([$id]);
            $finalImages = $finalImgStmt->fetchAll();
        }

        json_response([
            'staging' => $staging,
            'images' => $images,
            'article' => $article,
            'approved_images' => $finalImages,
        ]);
    }

    $reviewStatus = $_GET['review_status'] ?? null;
    $submittedBy = $_GET['submitted_by'] ?? null;

    $sql = "SELECT s.*,
        (SELECT COUNT(*) FROM staged_images si WHERE si.staging_id = s.id) AS image_count
        FROM staged_ingestions s WHERE 1=1";
    $params = [];

    if ($reviewStatus) {
        $sql .= " AND s.review_status = ?";
        $params[] = normalize_review_status($reviewStatus);
    }
    if ($submittedBy) {
        $sql .= " AND s.submitted_by = ?";
        $params[] = $submittedBy;
    }

    $sql .= " ORDER BY s.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    json_response($stmt->fetchAll());
}

if ($method === 'POST') {
    // POST /staging/{id}/approve
    if ($id && $action === 'approve') {
        $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        $reviewNotes = trim((string)($payload['review_notes'] ?? ''));
        $forcedStatus = null;
        if (isset($payload['status']) && $payload['status'] !== '') {
            $forcedStatus = normalize_article_status($payload['status']);
        }

        try {
            $db->beginTransaction();

            $stagingStmt = $db->prepare("SELECT * FROM staged_ingestions WHERE id = ? FOR UPDATE");
            $stagingStmt->execute([$id]);
            $staged = $stagingStmt->fetch();

            if (!$staged) {
                $db->rollBack();
                json_response(['error' => 'Staging record not found'], 404);
            }
            if (($staged['review_status'] ?? '') !== 'pending') {
                $db->rollBack();
                json_response(['error' => 'Only pending staging records can be approved'], 409);
            }

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
                (event_id, destination_id, staging_ingestion_id, slug, title, subtitle, category, tags, issue,
                 author_name, author_role, read_time, body, status, published_at, cover_image)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            $insertArticle->execute([
                $eventId,
                $destinationId,
                (int)$id,
                $articleSlug,
                $staged['title'],
                $staged['subtitle'] ?? null,
                $staged['category'] ?? null,
                $staged['tags'] ?? json_encode([]),
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

            $imgStmt = $db->prepare("SELECT * FROM staged_images WHERE staging_id = ? ORDER BY sort_order ASC, uploaded_at ASC");
            $imgStmt->execute([$id]);
            $stagedImages = $imgStmt->fetchAll();

            $coverImage = null;
            $createdImages = 0;
            foreach ($stagedImages as $img) {
                $stagingId = (int)($img['staging_id'] ?? 0);
                $legacyPath = rtrim(UPLOAD_DIR, '/') . '/' . ltrim((string)($img['storage_path'] ?? ''), '/');
                $currentPath = $stagingBaseDir . ($stagingId > 0 ? ($stagingId . '/') : '') . ($img['stored_filename'] ?? '');
                $oldPath = file_exists($currentPath) ? $currentPath : $legacyPath;
                if (!file_exists($oldPath)) {
                    continue;
                }

                $ext = strtolower(pathinfo($img['stored_filename'], PATHINFO_EXTENSION));
                $newFilename = uniqid('article_', true) . '_' . time() . ($ext ? '.' . $ext : '');
                $newRelativePath = 'data/prod/' . $newFilename;
                $newAbsolutePath = $prodBaseDir . $newFilename;
                $newDir = dirname($newAbsolutePath);

                if (!is_dir($newDir) && !mkdir($newDir, 0755, true) && !is_dir($newDir)) {
                    throw new RuntimeException('Could not create article upload directory');
                }

                if (!@rename($oldPath, $newAbsolutePath)) {
                    if (!@copy($oldPath, $newAbsolutePath)) {
                        throw new RuntimeException('Could not move staged image to article directory');
                    }
                    @unlink($oldPath);
                }

                $newUrl = $prodBaseUrl . $newFilename;
                $insertImg = $db->prepare("INSERT INTO images
                    (filename, url, alt_text, role, entity_type, entity_id, sort_order, staging_ingestion_id, staging_image_id)
                    VALUES (?,?,?,?,?,?,?,?,?)");
                $insertImg->execute([
                    $newFilename,
                    $newUrl,
                    $img['alt_text'] ?? '',
                    $img['role'] ?? 'gallery',
                    'article',
                    $articleId,
                    $img['sort_order'] ?? 0,
                    (int)$id,
                    (int)$img['id'],
                ]);

                if ($coverImage === null && in_array($img['role'] ?? '', ['hero', 'cover'], true)) {
                    $coverImage = $newUrl;
                }

                $createdImages++;
            }

            if ($coverImage !== null) {
                $db->prepare("UPDATE articles SET cover_image = ? WHERE id = ?")->execute([$coverImage, $articleId]);
            }

            $updateStaging = $db->prepare("UPDATE staged_ingestions
                SET review_status = 'approved',
                    review_notes = ?,
                    approved_by = ?,
                    approved_at = NOW(),
                    final_article_id = ?,
                    updated_at = NOW()
                WHERE id = ?");
            $updateStaging->execute([
                $reviewNotes !== '' ? $reviewNotes : null,
                $userId,
                $articleId,
                $id,
            ]);

            $db->commit();

            json_response([
                'approved' => true,
                'staging_id' => (int)$id,
                'article_id' => $articleId,
                'article_slug' => $articleSlug,
                'image_count' => $createdImages,
            ]);
        } catch (Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            json_response(['error' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    // POST /staging/{id}/reject
    if ($id && $action === 'reject') {
        $payload = json_decode(file_get_contents('php://input'), true) ?: [];
        $reviewNotes = trim((string)($payload['review_notes'] ?? ''));

        $stmt = $db->prepare("UPDATE staged_ingestions
            SET review_status = 'rejected',
                review_notes = ?,
                approved_by = ?,
                rejected_at = NOW(),
                updated_at = NOW()
            WHERE id = ? AND review_status = 'pending'");
        $stmt->execute([
            $reviewNotes !== '' ? $reviewNotes : null,
            $userId,
            $id,
        ]);

        if ($stmt->rowCount() === 0) {
            json_response(['error' => 'Only pending staging records can be rejected'], 409);
        }

        json_response(['rejected' => true, 'staging_id' => (int)$id]);
    }

    if ($id) {
        json_response(['error' => 'Invalid staging action'], 400);
    }

    // POST /staging
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || empty($data['title'])) {
        json_response(['error' => 'title is required'], 400);
    }

    $slug = !empty($data['slug']) ? slugify($data['slug']) : slugify($data['title']);
    $slug = $slug ?: slugify('staging-' . time());

    $tags = $data['tags'] ?? [];
    if (is_string($tags)) {
        $tags = array_values(array_filter(array_map('trim', explode(',', $tags))));
    }

    $desiredStatus = normalize_article_status($data['status'] ?? $data['desired_status'] ?? 'draft');

    $stmt = $db->prepare("INSERT INTO staged_ingestions
        (folder_name, title, slug, subtitle, category, tags, issue, author_name, author_role,
         read_time, destination_slug, event_slug, body, desired_status, submitted_by, review_status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $data['folder_name'] ?? null,
        $data['title'],
        $slug,
        $data['subtitle'] ?? null,
        $data['category'] ?? null,
        json_encode($tags),
        $data['issue'] ?? null,
        $data['author_name'] ?? 'Editorial Team',
        $data['author_role'] ?? null,
        $data['read_time'] ?? null,
        $data['destination'] ?? $data['destination_slug'] ?? null,
        $data['event_slug'] ?? null,
        $data['body'] ?? '',
        $desiredStatus,
        $userId,
        'pending',
    ]);

    json_response([
        'id' => (int)$db->lastInsertId(),
        'slug' => $slug,
        'review_status' => 'pending',
    ], 201);
}

json_response(['error' => 'Method not allowed'], 405);
