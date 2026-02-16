<?php
// api/routes/events.php
$db = get_db();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM events WHERE id = ? OR slug = ?");
            $stmt->execute([$id, $id]);
            $row = $stmt->fetch();
            json_response($row ?: ['error' => 'Not found'], $row ? 200 : 404);
        } else {
            $dest = $_GET['destination_id'] ?? null;
            $sql = "SELECT * FROM events";
            $params = [];
            if ($dest) { $sql .= " WHERE destination_id = ?"; $params[] = $dest; }
            $sql .= " ORDER BY start_date ASC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            json_response($stmt->fetchAll());
        }
        break;

    case 'POST':
        $user = require_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        $slug = $data['slug'] ?? slugify($data['name'] ?? '');
        $stmt = $db->prepare("INSERT INTO events
            (destination_id, slug, name, type, month, season, duration, hero_image, description, featured, start_date, end_date, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $data['destination_id'] ?? null, $slug, $data['name'],
            $data['type'] ?? null, $data['month'] ?? null, $data['season'] ?? null,
            $data['duration'] ?? null, $data['hero_image'] ?? null,
            $data['description'] ?? null, $data['featured'] ?? false,
            $data['start_date'] ?? null, $data['end_date'] ?? null,
            $data['status'] ?? 'draft',
        ]);
        json_response(['id' => (int)$db->lastInsertId(), 'slug' => $slug], 201);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
