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
