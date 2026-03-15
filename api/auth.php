<?php
// api/auth.php — Verify Supabase JWT (RS256 or HS256)

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

    [$headerB64, $payloadB64, $sig] = $parts;

    // Decode JWT header to determine algorithm
    $header = json_decode(b64url_decode($headerB64), true);
    $alg = $header['alg'] ?? 'HS256';

    if ($alg === 'RS256') {
        verify_rs256($headerB64 . '.' . $payloadB64, $sig, $header['kid'] ?? null);
    } else {
        verify_hs256($headerB64 . '.' . $payloadB64, $sig);
    }

    // Decode payload
    $claims = json_decode(b64url_decode($payloadB64), true);

    if (($claims['exp'] ?? 0) < time()) {
        json_response(['error' => 'Token expired'], 401);
    }

    return $claims;
}

function b64url_decode(string $data): string {
    $pad = strlen($data) % 4;
    if ($pad) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/'));
}

function verify_hs256(string $message, string $sig): void {
    $secret = SUPABASE_JWT_SECRET;
    if (!$secret) {
        json_response(['error' => 'JWT secret not configured'], 500);
    }
    $expected = hash_hmac('sha256', $message, $secret, true);
    $expected_b64 = rtrim(strtr(base64_encode($expected), '+/', '-_'), '=');
    if (!hash_equals($expected_b64, $sig)) {
        json_response(['error' => 'Invalid token signature'], 401);
    }
}

function verify_rs256(string $message, string $sig, ?string $kid): void {
    $jwks = fetch_jwks();
    $pem = null;

    foreach ($jwks['keys'] ?? [] as $key) {
        if ($kid === null || ($key['kid'] ?? null) === $kid) {
            $pem = jwk_to_pem($key);
            break;
        }
    }

    if (!$pem) {
        json_response(['error' => 'No matching public key found'], 401);
    }

    $pubKey = openssl_pkey_get_public($pem);
    if (!$pubKey) {
        json_response(['error' => 'Invalid public key'], 500);
    }

    $rawSig = b64url_decode($sig);
    $result = openssl_verify($message, $rawSig, $pubKey, OPENSSL_ALGO_SHA256);

    if ($result !== 1) {
        json_response(['error' => 'Invalid token signature'], 401);
    }
}

function fetch_jwks(): array {
    static $cache = null;
    if ($cache !== null) return $cache;

    $supabaseUrl = SUPABASE_URL;
    if (!$supabaseUrl) {
        json_response(['error' => 'SUPABASE_URL not configured'], 500);
    }

    $url = rtrim($supabaseUrl, '/') . '/auth/v1/.well-known/jwks.json';
    $json = @file_get_contents($url);

    if ($json === false) {
        json_response(['error' => 'Could not fetch JWKS from Supabase'], 500);
    }

    $cache = json_decode($json, true);
    return $cache;
}

function jwk_to_pem(array $jwk): string {
    $n = b64url_decode($jwk['n']);
    $e = b64url_decode($jwk['e']);

    // Ensure positive integers (prepend 0x00 if high bit set)
    if (ord($n[0]) & 0x80) $n = "\x00" . $n;
    if (ord($e[0]) & 0x80) $e = "\x00" . $e;

    $n_der = "\x02" . der_length(strlen($n)) . $n;
    $e_der = "\x02" . der_length(strlen($e)) . $e;
    $seq   = "\x30" . der_length(strlen($n_der) + strlen($e_der)) . $n_der . $e_der;

    $bitstring = "\x03" . der_length(strlen($seq) + 1) . "\x00" . $seq;
    $oid       = "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00";
    $der       = "\x30" . der_length(strlen($oid) + strlen($bitstring)) . $oid . $bitstring;

    return "-----BEGIN PUBLIC KEY-----\n" .
           chunk_split(base64_encode($der), 64, "\n") .
           "-----END PUBLIC KEY-----\n";
}

function der_length(int $len): string {
    if ($len < 128) return chr($len);
    $bytes = '';
    $tmp = $len;
    while ($tmp > 0) {
        $bytes = chr($tmp & 0xff) . $bytes;
        $tmp >>= 8;
    }
    return chr(0x80 | strlen($bytes)) . $bytes;
}
