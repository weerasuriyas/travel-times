<?php
// api/helpers/response.php
function json_response($data, int $code = 200): void {
    ob_clean();
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
