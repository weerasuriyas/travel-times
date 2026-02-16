# Article Ingestion Tool — Hostinger MySQL + SFTP

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an admin ingestion page where the user drops a folder (markdown + images) and it gets parsed, uploaded to Hostinger, and saved to Hostinger MySQL.

**Architecture:** React SPA sends Supabase JWT in Authorization header → PHP REST API on Hostinger verifies JWT → CRUD to MySQL + saves images to `public_html/uploads/`. Supabase stays auth-only. No new backend frameworks — vanilla PHP with PDO.

**Tech Stack:** PHP 8+ (Hostinger shared hosting), MySQL 8 (Hostinger), React 19, Vite, Tailwind CSS 4, Supabase Auth (JWT), gray-matter (frontmatter parsing)

---

## Task 1: Create MySQL Schema on Hostinger

**Files:**
- Create: `api/schema.sql` (reference file, executed via phpMyAdmin)

**Step 1: Write the SQL schema file**

```sql
-- schema.sql — Run in Hostinger phpMyAdmin

CREATE TABLE destinations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(500),
  description LONGTEXT,
  hero_image VARCHAR(500),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  region VARCHAR(255),
  highlights JSON,
  stats JSON,
  status ENUM('draft','published') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destination_id INT UNSIGNED,
  slug VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  type VARCHAR(255),
  month VARCHAR(100),
  season VARCHAR(100),
  duration VARCHAR(100),
  hero_image VARCHAR(500),
  description LONGTEXT,
  featured BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  status ENUM('draft','published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_dates (start_date, end_date),
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE articles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED,
  destination_id INT UNSIGNED,
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  subtitle TEXT,
  category VARCHAR(100),
  tags JSON,
  issue VARCHAR(255),
  author_name VARCHAR(255) DEFAULT 'Editorial Team',
  author_role VARCHAR(255),
  author_bio TEXT,
  author_avatar VARCHAR(500),
  read_time INT,
  body LONGTEXT NOT NULL,
  excerpt TEXT,
  cover_image VARCHAR(500),
  content JSON COMMENT 'sections, featured, introduction — structured content',
  status ENUM('draft','published') DEFAULT 'draft',
  published_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(500),
  role ENUM('hero','gallery','section','author_avatar','cover') DEFAULT 'gallery',
  entity_type ENUM('article','event','destination') NOT NULL,
  entity_id INT UNSIGNED,
  sort_order INT DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accommodations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id INT UNSIGNED,
  destination_id INT UNSIGNED,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  price_range VARCHAR(100),
  rating DECIMAL(3,1),
  description TEXT,
  image VARCHAR(500),
  tags JSON,
  coordinates JSON,
  booking_url VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE things_to_do (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  destination_id INT UNSIGNED,
  event_id INT UNSIGNED,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  image VARCHAR(500),
  duration VARCHAR(100),
  price VARCHAR(100),
  tags JSON,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE SET NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Step 2: Execute via phpMyAdmin**

1. Log in to Hostinger → Databases → phpMyAdmin
2. Select the database
3. Go to SQL tab
4. Paste the schema, click Execute
5. Verify 6 tables created

**Step 3: Commit the schema file**

```bash
git add api/schema.sql
git commit -m "feat: add MySQL schema for article ingestion"
```

---

## Task 2: Build PHP API — Core Files

**Files:**
- Create: `api/.htaccess`
- Create: `api/config.php`
- Create: `api/index.php`
- Create: `api/auth.php`
- Create: `api/helpers/db.php`
- Create: `api/helpers/response.php`
- Create: `api/helpers/slug.php`

**Step 1: Write `.htaccess` for routing + CORS**

```apache
# api/.htaccess
RewriteEngine On

# Handle CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule .* - [R=200,L]

# Route all requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.php [QSA,L]
```

**Step 2: Write `config.php`**

```php
<?php
// api/config.php
// IMPORTANT: Update these values from Hostinger dashboard

define('DB_HOST', 'localhost');
define('DB_NAME', 'your_db_name');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_pass');

// Get from Supabase Dashboard → Settings → API → JWT Secret
define('SUPABASE_JWT_SECRET', 'your-supabase-jwt-secret');

// Absolute path on Hostinger server
define('UPLOAD_DIR', '/home/username/public_html/uploads/');
// Public URL for uploaded files
define('UPLOAD_URL', 'https://yourdomain.com/uploads/');

// CORS — update with your actual SPA origins
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'https://yourdomain.com',
]);
```

**Step 3: Write `helpers/db.php`**

```php
<?php
// api/helpers/db.php
function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
    }
    return $pdo;
}
```

**Step 4: Write `helpers/response.php`**

```php
<?php
// api/helpers/response.php
function json_response($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
```

**Step 5: Write `helpers/slug.php`**

```php
<?php
// api/helpers/slug.php
function slugify(string $text): string {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-');
}
```

**Step 6: Write `auth.php`**

```php
<?php
// api/auth.php — Verify Supabase JWT (HS256)
function require_auth(): array {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = str_replace('Bearer ', '', $auth);

    if (!$token) {
        json_response(['error' => 'No token provided'], 401);
    }

    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        json_response(['error' => 'Invalid token format'], 401);
    }

    [$header, $payload, $sig] = $parts;

    // Verify HS256 signature
    $expected = hash_hmac('sha256', $header . '.' . $payload, SUPABASE_JWT_SECRET, true);
    $expected_b64 = rtrim(strtr(base64_encode($expected), '+/', '-_'), '=');

    if (!hash_equals($expected_b64, $sig)) {
        json_response(['error' => 'Invalid token signature'], 401);
    }

    // Decode payload
    $claims = json_decode(base64_decode(str_pad(
        strtr($payload, '-_', '+/'),
        strlen($payload) % 4 === 0 ? strlen($payload) : strlen($payload) + (4 - strlen($payload) % 4),
        '=',
        STR_PAD_RIGHT
    )), true);

    // Check expiry
    if (($claims['exp'] ?? 0) < time()) {
        json_response(['error' => 'Token expired'], 401);
    }

    return $claims;
}
```

**Step 7: Write `index.php` — Router**

```php
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

match($resource) {
    'articles'       => require __DIR__ . '/routes/articles.php',
    'events'         => require __DIR__ . '/routes/events.php',
    'destinations'   => require __DIR__ . '/routes/destinations.php',
    'images'         => require __DIR__ . '/routes/images.php',
    'health'         => json_response(['status' => 'ok', 'time' => date('c')]),
    default          => json_response(['error' => 'Not found'], 404),
};
```

**Step 8: Commit**

```bash
git add api/
git commit -m "feat: add PHP API core — config, auth, router, helpers"
```

---

## Task 3: Build PHP API — Route Files

**Files:**
- Create: `api/routes/articles.php`
- Create: `api/routes/events.php`
- Create: `api/routes/destinations.php`
- Create: `api/routes/images.php`

**Step 1: Write `routes/articles.php`**

```php
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
```

**Step 2: Write `routes/destinations.php`**

```php
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
```

**Step 3: Write `routes/events.php`**

```php
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
```

**Step 4: Write `routes/images.php`**

```php
<?php
// api/routes/images.php
$user = require_auth(); // All image ops need auth

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
    $dir = UPLOAD_DIR . $entity_type . '/';

    if (!is_dir($dir)) mkdir($dir, 0755, true);

    if (!move_uploaded_file($file['tmp_name'], $dir . $filename)) {
        json_response(['error' => 'Upload failed'], 500);
    }

    $url = UPLOAD_URL . $entity_type . '/' . $filename;

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
        $filepath = UPLOAD_DIR . $img['entity_type'] . '/' . $img['filename'];
        if (file_exists($filepath)) @unlink($filepath);
        $db->prepare("DELETE FROM images WHERE id = ?")->execute([$id]);
    }
    json_response(['deleted' => true]);
}

json_response(['error' => 'Method not allowed'], 405);
```

**Step 5: Commit**

```bash
git add api/routes/
git commit -m "feat: add PHP API routes — articles, events, destinations, images"
```

---

## Task 4: Add VITE_API_URL Environment Variable

**Files:**
- Modify: `.env`
- Create: `src/lib/api.js`

**Step 1: Add env var to `.env`**

Add this line to the existing `.env` file:

```
VITE_API_URL=https://yourdomain.com/api
```

**Step 2: Create API helper**

```javascript
// src/lib/api.js
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

export async function apiGet(path) {
  const res = await fetch(`${API_URL}/${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function apiPost(path, data) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

export async function apiPut(path, data) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

export async function apiDelete(path) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/${path}`, {
    method: 'DELETE',
    headers,
  })
  return res.json()
}

export async function apiUploadImage(file, entityType, entityId, role = 'gallery', altText = '') {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')

  const fd = new FormData()
  fd.append('image', file)
  fd.append('entity_type', entityType)
  fd.append('entity_id', entityId || '')
  fd.append('role', role)
  fd.append('alt_text', altText)

  const res = await fetch(`${API_URL}/images`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}` },
    body: fd,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Upload failed')
  return json
}
```

**Step 3: Commit**

```bash
git add src/lib/api.js
git commit -m "feat: add API client with JWT auth forwarding"
```

---

## Task 5: Install gray-matter for Frontmatter Parsing

**Step 1: Install dependency**

```bash
npm install gray-matter
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add gray-matter for markdown frontmatter parsing"
```

---

## Task 6: Build AdminIngestion Page — Drop Zone + Parser

**Files:**
- Create: `src/pages/AdminIngestion.jsx`
- Modify: `src/App.jsx` (add route)
- Modify: `src/pages/AdminDashboard.jsx` (add nav link)

**Step 1: Create `AdminIngestion.jsx`**

This is the main ingestion page. It has:
1. A drop zone that accepts a folder (via `webkitdirectory`)
2. Parses `article.md` frontmatter using `gray-matter`
3. Detects images in the folder
4. Shows a preview with editable metadata fields
5. Upload button that sends everything to the Hostinger API

```jsx
// src/pages/AdminIngestion.jsx
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FolderOpen, FileText, Image as ImageIcon, Check, AlertCircle, X, LogOut, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiPost, apiUploadImage } from '../lib/api'
import matter from 'gray-matter'

export default function AdminIngestion() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [step, setStep] = useState('drop') // drop | preview | uploading | done
  const [files, setFiles] = useState([])
  const [images, setImages] = useState([])
  const [markdown, setMarkdown] = useState('')
  const [meta, setMeta] = useState({
    title: '', slug: '', subtitle: '', category: 'Culture',
    tags: '', issue: '', author_name: 'Sanath Weerasuriya',
    author_role: 'Field Correspondent', read_time: 8,
    destination: '', event_slug: '', status: 'draft',
  })
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') }
    catch (e) { console.error('Error signing out:', e) }
  }

  // Handle folder drop or file input
  const handleFiles = useCallback((fileList) => {
    const allFiles = Array.from(fileList)
    const imageFiles = allFiles.filter(f =>
      /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name)
    )
    const mdFile = allFiles.find(f => /\.(md|txt)$/i.test(f.name))

    setFiles(allFiles)
    setImages(imageFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      role: f.name.match(/hero|cover|banner/i) ? 'hero' : 'gallery',
      name: f.name,
    })))

    if (mdFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const raw = e.target.result
        try {
          const { data: fm, content } = matter(raw)
          setMarkdown(content)
          setMeta(prev => ({
            ...prev,
            title: fm.title || prev.title,
            slug: fm.slug || fm['event-slug'] || prev.slug,
            subtitle: fm.subtitle || prev.subtitle,
            category: fm.category || prev.category,
            tags: Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || prev.tags),
            issue: fm.issue || prev.issue,
            author_name: fm['author-name'] || fm.author || prev.author_name,
            author_role: fm['author-role'] || prev.author_role,
            read_time: fm['read-time'] || fm.readTime || prev.read_time,
            destination: fm.destination || prev.destination,
            event_slug: fm['event-slug'] || prev.event_slug,
            status: fm.status || prev.status,
          }))
        } catch {
          setMarkdown(raw)
        }
        setStep('preview')
      }
      reader.readAsText(mdFile)
    } else if (imageFiles.length > 0) {
      setStep('preview')
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const items = e.dataTransfer.items
    if (items) {
      const filePromises = []
      for (const item of items) {
        const entry = item.webkitGetAsEntry?.()
        if (entry) {
          filePromises.push(readEntry(entry))
        }
      }
      Promise.all(filePromises).then(results => {
        handleFiles(results.flat())
      })
    } else {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  // Recursively read directory entries
  const readEntry = (entry) => {
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(file => resolve([file]))
      } else if (entry.isDirectory) {
        const reader = entry.createReader()
        reader.readEntries(async (entries) => {
          const results = await Promise.all(entries.map(readEntry))
          resolve(results.flat())
        })
      }
    })
  }

  const handleInputChange = (e) => {
    handleFiles(e.target.files)
  }

  const updateMeta = (field, value) => {
    setMeta(prev => ({ ...prev, [field]: value }))
  }

  const setImageRole = (idx, role) => {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, role } : img))
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  // Upload everything
  const handleSubmit = async () => {
    setStep('uploading')
    setError(null)
    const total = 1 + images.length // article + images
    setProgress({ current: 0, total, message: 'Creating article...' })

    try {
      // 1. Create article
      const tags = meta.tags.split(',').map(t => t.trim()).filter(Boolean)
      const articleRes = await apiPost('articles', {
        title: meta.title,
        slug: meta.slug || undefined,
        subtitle: meta.subtitle,
        category: meta.category,
        tags,
        issue: meta.issue,
        author_name: meta.author_name,
        author_role: meta.author_role,
        read_time: parseInt(meta.read_time) || null,
        body: markdown,
        status: meta.status,
      })

      setProgress({ current: 1, total, message: 'Uploading images...' })

      // 2. Upload images
      const uploadedImages = []
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        setProgress({
          current: 1 + i,
          total,
          message: `Uploading ${img.name} (${i + 1}/${images.length})...`
        })
        const imgRes = await apiUploadImage(
          img.file, 'article', articleRes.id, img.role, img.name
        )
        uploadedImages.push(imgRes)

        // If this is the hero image, update article cover_image
        if (img.role === 'hero') {
          await apiPost(`articles/${articleRes.id}`, { ...meta, cover_image: imgRes.url }).catch(() => {})
        }
      }

      setProgress({ current: total, total, message: 'Done!' })
      setResult({ article: articleRes, images: uploadedImages })
      setStep('done')
    } catch (err) {
      setError(err.message)
      setStep('preview')
    }
  }

  const reset = () => {
    setStep('drop')
    setFiles([])
    setImages([])
    setMarkdown('')
    setMeta({
      title: '', slug: '', subtitle: '', category: 'Culture',
      tags: '', issue: '', author_name: 'Sanath Weerasuriya',
      author_role: 'Field Correspondent', read_time: 8,
      destination: '', event_slug: '', status: 'draft',
    })
    setProgress({ current: 0, total: 0, message: '' })
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Admin Header */}
      <div className="bg-stone-950 text-stone-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Article Ingestion</h1>
              <p className="text-stone-400 text-sm mt-1">Drop a folder to ingest</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm">
                <ArrowLeft size={16} /> Dashboard
              </button>
              <button onClick={() => navigate('/')}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors text-sm">
                ← Back to Site
              </button>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto"><X size={16} className="text-red-400" /></button>
          </div>
        )}

        {/* Step 1: Drop Zone */}
        {step === 'drop' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-stone-300 rounded-2xl p-16 text-center hover:border-[#00E676] transition-colors cursor-pointer bg-white"
          >
            <FolderOpen className="mx-auto mb-4 text-stone-400" size={64} />
            <h2 className="text-2xl font-bold text-stone-950 mb-2">Drop Article Folder Here</h2>
            <p className="text-stone-500 mb-6">
              Folder should contain <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">article.md</code> and an <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">images/</code> folder
            </p>
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-stone-950 cursor-pointer transition-all shadow-sm"
              style={{ backgroundColor: '#00E676' }}>
              <Upload size={20} />
              Select Folder
              <input
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-stone-400 mt-4">Or drag and drop a folder directly</p>

            {/* Format guide */}
            <div className="mt-12 text-left max-w-md mx-auto bg-stone-50 rounded-xl p-6">
              <h3 className="font-bold text-sm text-stone-700 mb-3">Expected folder format:</h3>
              <pre className="text-xs text-stone-600 font-mono leading-relaxed">{`my-article/
  article.md        ← YAML frontmatter + body
  images/
    cover.jpg       ← named "hero/cover/banner" = auto-hero
    photo1.jpg
    photo2.webp`}</pre>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Edit */}
        {step === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-950">Review & Edit</h2>
              <div className="flex gap-3">
                <button onClick={reset} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg text-sm font-medium">
                  Start Over
                </button>
                <button onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-stone-950 shadow-sm"
                  style={{ backgroundColor: '#00E676' }}>
                  <Upload size={18} /> Ingest Article
                </button>
              </div>
            </div>

            {/* Metadata Form */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
              <h3 className="font-bold text-stone-950">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Title *</label>
                  <input value={meta.title} onChange={e => updateMeta('title', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Slug</label>
                  <input value={meta.slug} onChange={e => updateMeta('slug', e.target.value)}
                    placeholder="auto-generated from title"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Subtitle</label>
                  <input value={meta.subtitle} onChange={e => updateMeta('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Category</label>
                  <select value={meta.category} onChange={e => updateMeta('category', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                    <option>Culture</option><option>Travel</option><option>Food</option>
                    <option>Adventure</option><option>Nature</option><option>Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Tags (comma-separated)</label>
                  <input value={meta.tags} onChange={e => updateMeta('tags', e.target.value)}
                    placeholder="Festival, Heritage, Buddhist"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Author</label>
                  <input value={meta.author_name} onChange={e => updateMeta('author_name', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Author Role</label>
                  <input value={meta.author_role} onChange={e => updateMeta('author_role', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Issue</label>
                  <input value={meta.issue} onChange={e => updateMeta('issue', e.target.value)}
                    placeholder="Issue 04: The Relic"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Read Time (min)</label>
                  <input type="number" value={meta.read_time} onChange={e => updateMeta('read_time', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1">Status</label>
                  <select value={meta.status} onChange={e => updateMeta('status', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Article Body Preview */}
            {markdown && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-stone-950 flex items-center gap-2">
                    <FileText size={18} /> Article Body
                  </h3>
                  <span className="text-xs text-stone-500">{markdown.length} chars</span>
                </div>
                <div className="bg-stone-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-stone-700 whitespace-pre-wrap font-mono">{markdown}</pre>
                </div>
              </div>
            )}

            {/* Images Preview */}
            {images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h3 className="font-bold text-stone-950 flex items-center gap-2 mb-4">
                  <ImageIcon size={18} /> Images ({images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.preview} alt={img.name}
                        className="w-full aspect-square object-cover rounded-lg border border-stone-200" />
                      <button onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <X size={12} />
                      </button>
                      <p className="text-[10px] text-stone-500 mt-1 truncate">{img.name}</p>
                      <select value={img.role} onChange={e => setImageRole(idx, e.target.value)}
                        className="w-full mt-1 text-xs px-2 py-1 border border-stone-200 rounded cursor-pointer">
                        <option value="hero">Hero</option>
                        <option value="gallery">Gallery</option>
                        <option value="section">Section</option>
                        <option value="cover">Cover</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Uploading */}
        {step === 'uploading' && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <Loader2 className="mx-auto mb-4 text-[#00E676] animate-spin" size={48} />
            <h2 className="text-xl font-bold text-stone-950 mb-2">Ingesting...</h2>
            <p className="text-stone-500 mb-6">{progress.message}</p>
            <div className="w-full max-w-md mx-auto bg-stone-100 rounded-full h-3">
              <div className="bg-[#00E676] h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-stone-400 mt-2">{progress.current} / {progress.total}</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && result && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00E676]/20 flex items-center justify-center mx-auto mb-4">
              <Check className="text-[#00E676]" size={32} />
            </div>
            <h2 className="text-xl font-bold text-stone-950 mb-2">Article Ingested!</h2>
            <p className="text-stone-500 mb-2">
              Article #{result.article.id} — <code className="bg-stone-100 px-2 py-0.5 rounded text-sm">{result.article.slug}</code>
            </p>
            <p className="text-stone-400 text-sm mb-8">
              {result.images.length} image{result.images.length !== 1 ? 's' : ''} uploaded
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={reset}
                className="px-6 py-2 rounded-lg font-medium text-stone-950 shadow-sm"
                style={{ backgroundColor: '#00E676' }}>
                Ingest Another
              </button>
              <button onClick={() => navigate('/admin')}
                className="px-6 py-2 bg-stone-200 hover:bg-stone-300 rounded-lg font-medium text-sm">
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Add route in App.jsx**

Add lazy import after AdminLogin:

```jsx
const AdminIngestion = lazy(() => import('./pages/AdminIngestion'))
```

Add route after `/admin/editor`:

```jsx
<Route path="/admin/ingest" element={
  <ProtectedRoute>
    <AdminIngestion />
  </ProtectedRoute>
} />
```

**Step 3: Add nav link in AdminDashboard.jsx**

After the "New Article" button in the Actions Bar, add an "Ingest Article" button:

```jsx
<button
  onClick={() => navigate('/admin/ingest')}
  className="flex items-center gap-2 px-6 py-2 bg-stone-950 text-white rounded-lg font-medium transition-all shadow-sm whitespace-nowrap hover:bg-stone-800"
>
  <Upload size={20} />
  Ingest Folder
</button>
```

**Step 4: Verify build passes**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/pages/AdminIngestion.jsx src/App.jsx src/pages/AdminDashboard.jsx
git commit -m "feat: add article ingestion page with folder drop, frontmatter parsing, image upload"
```

---

## Task 7: Deploy PHP API to Hostinger

**Manual steps — not code commits:**

**Step 1: Update `api/config.php` with real credentials**

Get from Hostinger dashboard:
- Database name, user, password (Databases section)
- Supabase JWT Secret (Supabase → Settings → API → JWT Secret)
- Upload directory path and URL

**Step 2: Create uploads directory on Hostinger**

Via File Manager or SFTP:
```
public_html/uploads/
public_html/uploads/article/
public_html/uploads/event/
public_html/uploads/destination/
```
Set permissions to 755.

**Step 3: Upload API files via SFTP**

Upload the entire `api/` folder to `public_html/api/` on Hostinger.

**Step 4: Test health endpoint**

```
GET https://yourdomain.com/api/health
→ {"status":"ok","time":"2026-02-15T..."}
```

**Step 5: Update `.env` with real API URL**

```
VITE_API_URL=https://yourdomain.com/api
```

**Step 6: Test from local dev**

```bash
npm run dev
# Navigate to /admin/ingest
# Drop a test folder
# Verify article creates + images upload
```

---

## Article Folder Format Reference

The user should prepare folders like this:

```
my-article-folder/
  article.md              ← required
  images/
    cover.jpg             ← "hero/cover/banner" in name = auto-assigned hero role
    photo1.jpg            ← defaults to gallery role
    photo2.webp
```

### `article.md` frontmatter:

```yaml
---
title: "THE FIRE OF KANDY"
subtitle: "We walked through the smoke of a thousand copra torches..."
slug: kandy-perahera
category: Culture
tags: [Festival, Heritage, Buddhist, Kandy]
issue: "Issue 04: The Relic"
author-name: "Sanath Weerasuriya"
author-role: "Field Correspondent"
read-time: 8
destination: kandy
event-slug: kandy-perahera
status: draft
---

## Introduction

The historic 'Esala Perahera' in Kandy...

## The Procession

Heralded by thousands of Kandyan drummers...
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/articles` | No | List articles |
| GET | `/api/articles/:id` | No | Get by id or slug |
| POST | `/api/articles` | Yes | Create article |
| PUT | `/api/articles/:id` | Yes | Update article |
| DELETE | `/api/articles/:id` | Yes | Delete article |
| GET | `/api/destinations` | No | List destinations |
| POST | `/api/destinations` | Yes | Create destination |
| PUT | `/api/destinations/:id` | Yes | Update destination |
| GET | `/api/events` | No | List events |
| POST | `/api/events` | Yes | Create event |
| POST | `/api/images` | Yes | Upload image (multipart) |
| GET | `/api/images` | No | List images by entity |
| DELETE | `/api/images/:id` | Yes | Delete image + file |
