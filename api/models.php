<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(['ok' => true, 'models' => read_json('models.json')]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();
    $body = request_body();
    $name = trim((string) ($body['name'] ?? ''));
    $brand = trim((string) ($body['brand'] ?? 'Bandai'));
    $category = trim((string) ($body['category'] ?? 'Gunpla'));
    $price = trim((string) ($body['price'] ?? '')) ?: 'Đang cập nhật';
    $link = trim((string) ($body['link'] ?? ''));
    $image = trim((string) ($body['image'] ?? ''));
    $description = trim((string) ($body['description'] ?? '')) ?: 'Model kit chính hãng được cập nhật bởi ERIFTverse.';

    if ($name === '' || $link === '') {
        json_response(['ok' => false, 'message' => 'Tên model và link sản phẩm là bắt buộc.'], 422);
    }
    if (!filter_var($link, FILTER_VALIDATE_URL) || !in_array(parse_url($link, PHP_URL_SCHEME), ['http', 'https'], true)) {
        json_response(['ok' => false, 'message' => 'Link sản phẩm không hợp lệ.'], 422);
    }
    if ($image !== '' && (!filter_var($image, FILTER_VALIDATE_URL) || !in_array(parse_url($image, PHP_URL_SCHEME), ['http', 'https'], true))) {
        json_response(['ok' => false, 'message' => 'Link ảnh không hợp lệ.'], 422);
    }

    $models = read_json('models.json');
    $model = [
        'id' => bin2hex(random_bytes(8)),
        'name' => $name,
        'brand' => $brand,
        'category' => $category,
        'price' => $price,
        'link' => $link,
        'image' => $image,
        'description' => $description,
        'official' => true,
        'created_at' => date(DATE_ATOM),
    ];
    array_unshift($models, $model);
    write_json('models.json', $models);
    json_response(['ok' => true, 'model' => $model]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    require_admin();
    $id = (string) ($_GET['id'] ?? '');
    $models = array_values(array_filter(read_json('models.json'), static fn (array $model): bool => ($model['id'] ?? '') !== $id));
    write_json('models.json', $models);
    json_response(['ok' => true]);
}

json_response(['ok' => false, 'message' => 'Phương thức không hợp lệ.'], 405);
