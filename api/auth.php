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
