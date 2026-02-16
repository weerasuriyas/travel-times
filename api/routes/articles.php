<?php
// api/routes/articles.php
$db = get_db();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM articles WHERE id = ? OR slug = ?");
            $stmt->execute([$id, $id]);
            $article = $stmt->fetch();
            json_response($article ?: ['error' => 'Not found'], $article ? 200 : 404);
        } else {
            $status = $_GET['status'] ?? null;
            $destination = $_GET['destination_id'] ?? null;
            $sql = "SELECT * FROM articles WHERE 1=1";
            $params = [];
            if ($status) { $sql .= " AND status = ?"; $params[] = $status; }
            if ($destination) { $sql .= " AND destination_id = ?"; $params[] = $destination; }
            $sql .= " ORDER BY created_at DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            json_response($stmt->fetchAll());
        }
        break;

    case 'POST':
        $user = require_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['title'])) {
            json_response(['error' => 'Title is required'], 400);
        }
        $slug = $data['slug'] ?? slugify($data['title']);
        $stmt = $db->prepare("INSERT INTO articles
            (slug, title, subtitle, category, tags, issue, author_name, author_role, author_bio, author_avatar, read_time, body, excerpt, cover_image, content, status, published_at, event_id, destination_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $slug,
            $data['title'],
            $data['subtitle'] ?? null,
            $data['category'] ?? null,
            json_encode($data['tags'] ?? []),
            $data['issue'] ?? null,
            $data['author_name'] ?? 'Editorial Team',
            $data['author_role'] ?? null,
            $data['author_bio'] ?? null,
            $data['author_avatar'] ?? null,
            $data['read_time'] ?? null,
            $data['body'] ?? '',
            $data['excerpt'] ?? null,
            $data['cover_image'] ?? null,
            json_encode($data['content'] ?? null),
            $data['status'] ?? 'draft',
            ($data['status'] ?? '') === 'published' ? date('Y-m-d H:i:s') : null,
            $data['event_id'] ?? null,
            $data['destination_id'] ?? null,
        ]);
        json_response(['id' => (int)$db->lastInsertId(), 'slug' => $slug], 201);
        break;

    case 'PUT':
        $user = require_auth();
        if (!$id) json_response(['error' => 'ID required'], 400);
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("UPDATE articles SET
            title=?, subtitle=?, category=?, tags=?, issue=?, author_name=?, author_role=?,
            read_time=?, body=?, excerpt=?, cover_image=?, content=?, status=?, published_at=?,
            event_id=?, destination_id=?
            WHERE id=?");
        $stmt->execute([
            $data['title'], $data['subtitle'] ?? null, $data['category'] ?? null,
            json_encode($data['tags'] ?? []), $data['issue'] ?? null,
            $data['author_name'] ?? 'Editorial Team', $data['author_role'] ?? null,
            $data['read_time'] ?? null, $data['body'] ?? '', $data['excerpt'] ?? null,
            $data['cover_image'] ?? null, json_encode($data['content'] ?? null),
            $data['status'] ?? 'draft',
            ($data['status'] ?? '') === 'published' ? date('Y-m-d H:i:s') : null,
            $data['event_id'] ?? null, $data['destination_id'] ?? null,
            $id
        ]);
        json_response(['updated' => true]);
        break;

    case 'DELETE':
        $user = require_auth();
        if (!$id) json_response(['error' => 'ID required'], 400);
        $db->prepare("DELETE FROM articles WHERE id = ?")->execute([$id]);
        json_response(['deleted' => true]);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
