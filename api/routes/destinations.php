<?php
// api/routes/destinations.php
$db = get_db();

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM destinations WHERE id = ? OR slug = ?");
            $stmt->execute([$id, $id]);
            $row = $stmt->fetch();
            json_response($row ?: ['error' => 'Not found'], $row ? 200 : 404);
        } else {
            $stmt = $db->query("SELECT * FROM destinations ORDER BY name ASC");
            json_response($stmt->fetchAll());
        }
        break;

    case 'POST':
        $user = require_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        $slug = $data['slug'] ?? slugify($data['name'] ?? '');
        $stmt = $db->prepare("INSERT INTO destinations
            (slug, name, tagline, description, hero_image, lat, lng, region, highlights, stats, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $slug, $data['name'], $data['tagline'] ?? null, $data['description'] ?? null,
            $data['hero_image'] ?? null, $data['lat'] ?? null, $data['lng'] ?? null,
            $data['region'] ?? null, json_encode($data['highlights'] ?? []),
            json_encode($data['stats'] ?? null), $data['status'] ?? 'published',
        ]);
        json_response(['id' => (int)$db->lastInsertId(), 'slug' => $slug], 201);
        break;

    case 'PUT':
        $user = require_auth();
        if (!$id) json_response(['error' => 'ID required'], 400);
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("UPDATE destinations SET
            name=?, tagline=?, description=?, hero_image=?, lat=?, lng=?, region=?, highlights=?, stats=?, status=?
            WHERE id=?");
        $stmt->execute([
            $data['name'], $data['tagline'] ?? null, $data['description'] ?? null,
            $data['hero_image'] ?? null, $data['lat'] ?? null, $data['lng'] ?? null,
            $data['region'] ?? null, json_encode($data['highlights'] ?? []),
            json_encode($data['stats'] ?? null), $data['status'] ?? 'published', $id
        ]);
        json_response(['updated' => true]);
        break;

    default:
        json_response(['error' => 'Method not allowed'], 405);
}
