<?php
declare(strict_types=1);

const ADMIN_EMAIL = 'adminemail';
const ADMIN_PASSWORD = 'passadmin';
const APP_ENV = 'production';
const SMTP_USERNAME = 'email';
const SMTP_PASSWORD = 'App Password';

$dataDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDirectory)) {
    mkdir($dataDirectory, 0775, true);
}

function data_path(string $name): string
{
    global $dataDirectory;
    return $dataDirectory . DIRECTORY_SEPARATOR . $name;
}

function read_json(string $name, array $default = []): array
{
    $path = data_path($name);
    if (!is_file($path)) {
        return $default;
    }

    $decoded = json_decode((string) file_get_contents($path), true);
    return is_array($decoded) ? $decoded : $default;
}

function write_json(string $name, array $data): bool
{
    return file_put_contents(
        data_path($name),
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    ) !== false;
}

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function request_body(): array
{
    $body = json_decode((string) file_get_contents('php://input'), true);
    return is_array($body) ? $body : [];
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_response(['ok' => false, 'message' => 'Phương thức không hợp lệ.'], 405);
    }
}

function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        json_response(['ok' => false, 'message' => 'Bạn cần đăng nhập.'], 401);
    }
    return $user;
}

function require_admin(): array
{
    $user = require_login();
    if (($user['role'] ?? '') !== 'admin') {
        json_response(['ok' => false, 'message' => 'Bạn không có quyền admin.'], 403);
    }
    return $user;
}

session_start();
