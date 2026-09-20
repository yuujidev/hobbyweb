<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mailer.php';

$action = $_GET['action'] ?? '';
$body = request_body();

if ($action === 'register') {
    require_post();
    $username = trim((string) ($body['username'] ?? ''));
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $phone = trim((string) ($body['phone'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $confirmPassword = (string) ($body['confirm_password'] ?? '');

    if (!preg_match('/^[a-zA-Z0-9_]{3,30}$/', $username)) {
        json_response(['ok' => false, 'message' => 'Username chỉ gồm chữ, số, dấu gạch dưới và dài 3-30 ký tự.'], 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !str_ends_with($email, '@gmail.com')) {
        json_response(['ok' => false, 'message' => 'Vui lòng nhập địa chỉ Gmail hợp lệ.'], 422);
    }
    if ($phone !== '' && !preg_match('/^(0|\+84)[0-9]{9,10}$/', preg_replace('/[\s.-]/', '', $phone))) {
        json_response(['ok' => false, 'message' => 'Số điện thoại không hợp lệ.'], 422);
    }
    if (strlen($password) < 8 || strlen($password) > 20) {
        json_response(['ok' => false, 'message' => 'Mật khẩu phải có từ 8 đến 20 ký tự.'], 422);
    }
    if ($password !== $confirmPassword) {
        json_response(['ok' => false, 'message' => 'Mật khẩu xác nhận không trùng khớp.'], 422);
    }

    $accounts = read_json('accounts.json');
    foreach ($accounts as $account) {
        if (strcasecmp($account['username'], $username) === 0) {
            json_response(['ok' => false, 'message' => 'Username này đã được sử dụng.'], 409);
        }
        if (strcasecmp($account['email'], $email) === 0) {
            json_response(['ok' => false, 'message' => 'Gmail này đã được đăng ký.'], 409);
        }
    }

    $otp = (string) random_int(100000, 999999);
    $pending = [
        'username' => $username,
        'email' => $email,
        'phone' => $phone,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'otp_hash' => password_hash($otp, PASSWORD_DEFAULT),
        'expires_at' => time() + 600,
    ];
    $mailResult = send_otp_email($email, $otp);
    if (!$mailResult['sent']) {
        json_response(['ok' => false, 'message' => 'Không thể gửi email OTP. Hãy kiểm tra App Password Gmail trong api/config.php.'], 503);
    }
    write_json('pending_registration.json', $pending);
    $response = ['ok' => true, 'message' => "Mã xác nhận đã được gửi tới {$email}."];
    if (APP_ENV === 'local' && !$mailResult['sent']) {
        $response['dev_otp'] = $otp;
        $response['message'] .= ' SMTP chưa có App Password hợp lệ, mã local được hiển thị để kiểm thử.';
    }
    json_response($response);
}

if ($action === 'verify') {
    require_post();
    $otp = trim((string) ($body['otp'] ?? ''));
    $pending = read_json('pending_registration.json', []);
    if (!$pending || time() > (int) ($pending['expires_at'] ?? 0)) {
        json_response(['ok' => false, 'message' => 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.'], 422);
    }
    if (!password_verify($otp, $pending['otp_hash'])) {
        json_response(['ok' => false, 'message' => 'Mã OTP không đúng.'], 422);
    }

    $accounts = read_json('accounts.json');
    $accounts[] = [
        'username' => $pending['username'],
        'email' => $pending['email'],
        'phone' => $pending['phone'],
        'password_hash' => $pending['password_hash'],
        'email_verified' => true,
        'role' => 'member',
    ];
    write_json('accounts.json', $accounts);
    @unlink(data_path('pending_registration.json'));
    json_response(['ok' => true, 'message' => 'Xác nhận email thành công. Bạn có thể đăng nhập ngay.']);
}

if ($action === 'login') {
    require_post();
    $identifier = strtolower(trim((string) ($body['identifier'] ?? '')));
    $password = (string) ($body['password'] ?? '');

    if ($identifier === ADMIN_EMAIL && hash_equals(ADMIN_PASSWORD, $password)) {
        $_SESSION['user'] = ['username' => ADMIN_EMAIL, 'email' => ADMIN_EMAIL, 'role' => 'admin', 'email_verified' => true];
        json_response(['ok' => true, 'role' => 'admin', 'redirect' => '../admin/index.html']);
    }

    $account = null;
    foreach (read_json('accounts.json') as $savedAccount) {
        if (strcasecmp($savedAccount['username'], $identifier) === 0 || strcasecmp($savedAccount['email'], $identifier) === 0) {
            $account = $savedAccount;
            break;
        }
    }
    if (!$account || !password_verify($password, $account['password_hash'])) {
        json_response(['ok' => false, 'message' => 'Username hoặc mật khẩu không đúng.'], 401);
    }
    if (empty($account['email_verified'])) {
        json_response(['ok' => false, 'message' => 'Email chưa được xác nhận.'], 403);
    }

    $_SESSION['user'] = [
        'username' => $account['username'],
        'email' => $account['email'],
        'phone' => $account['phone'],
        'role' => 'member',
        'email_verified' => true,
    ];
    json_response(['ok' => true, 'role' => 'member', 'redirect' => '../home/index.html']);
}

if ($action === 'me') {
    $user = current_user();
    json_response(['ok' => true, 'user' => $user]);
}

if ($action === 'update-profile') {
    require_post();
    $user = require_login();
    $username = trim((string) ($body['username'] ?? ''));
    $phone = trim((string) ($body['phone'] ?? ''));
    $normalizedPhone = preg_replace('/[\s.-]/', '', $phone);

    if (!preg_match('/^[a-zA-Z0-9_]{3,30}$/', $username)) {
        json_response(['ok' => false, 'message' => 'Username chỉ gồm chữ, số, dấu gạch dưới và dài 3-30 ký tự.'], 422);
    }
    if ($phone !== '' && !preg_match('/^(0|\+84)[0-9]{9,10}$/', $normalizedPhone)) {
        json_response(['ok' => false, 'message' => 'Số điện thoại không hợp lệ.'], 422);
    }

    $accounts = read_json('accounts.json');
    $accountIndex = null;
    foreach ($accounts as $index => $account) {
        if (strcasecmp($account['username'], $user['username']) === 0) {
            $accountIndex = $index;
            break;
        }
    }
    if ($accountIndex === null) {
        json_response(['ok' => false, 'message' => 'Không tìm thấy tài khoản.'], 404);
    }
    foreach ($accounts as $index => $account) {
        if ($index !== $accountIndex && strcasecmp($account['username'], $username) === 0) {
            json_response(['ok' => false, 'message' => 'Username này đã được sử dụng.'], 409);
        }
    }

    $currentPhone = (string) ($accounts[$accountIndex]['phone'] ?? '');
    if ($currentPhone === '' && $normalizedPhone !== '') {
        $otp = (string) random_int(100000, 999999);
        $mailResult = send_otp_email($user['email'], $otp);
        if (!$mailResult['sent']) {
            json_response(['ok' => false, 'message' => 'Không thể gửi email OTP. Hãy kiểm tra App Password Gmail trong api/config.php.'], 503);
        }
        $_SESSION['pending_profile_update'] = [
            'account_username' => $user['username'],
            'username' => $username,
            'phone' => $normalizedPhone,
            'otp_hash' => password_hash($otp, PASSWORD_DEFAULT),
            'expires_at' => time() + 600,
        ];
        json_response(['ok' => true, 'requires_otp' => true, 'message' => "Mã xác nhận đã được gửi tới {$user['email']}."]);
    }

    $accounts[$accountIndex]['username'] = $username;
    $accounts[$accountIndex]['phone'] = $normalizedPhone;
    write_json('accounts.json', $accounts);
    $_SESSION['user']['username'] = $username;
    $_SESSION['user']['phone'] = $normalizedPhone;
    json_response(['ok' => true, 'message' => 'Cập nhật thông tin thành công.', 'user' => $_SESSION['user']]);
}

if ($action === 'verify-profile') {
    require_post();
    $user = require_login();
    $otp = trim((string) ($body['otp'] ?? ''));
    $pending = $_SESSION['pending_profile_update'] ?? null;
    if (!$pending || time() > (int) ($pending['expires_at'] ?? 0)) {
        unset($_SESSION['pending_profile_update']);
        json_response(['ok' => false, 'message' => 'Mã OTP đã hết hạn. Vui lòng gửi lại thông tin.'], 422);
    }
    if (!password_verify($otp, $pending['otp_hash'])) {
        json_response(['ok' => false, 'message' => 'Mã OTP không đúng.'], 422);
    }

    $accounts = read_json('accounts.json');
    $accountIndex = null;
    foreach ($accounts as $index => $account) {
        if (strcasecmp($account['username'], $pending['account_username']) === 0 && strcasecmp($account['email'], $user['email']) === 0) {
            $accountIndex = $index;
            break;
        }
    }
    if ($accountIndex === null) {
        unset($_SESSION['pending_profile_update']);
        json_response(['ok' => false, 'message' => 'Không tìm thấy tài khoản.'], 404);
    }
    foreach ($accounts as $index => $account) {
        if ($index !== $accountIndex && strcasecmp($account['username'], $pending['username']) === 0) {
            json_response(['ok' => false, 'message' => 'Username này đã được sử dụng.'], 409);
        }
    }

    $accounts[$accountIndex]['username'] = $pending['username'];
    $accounts[$accountIndex]['phone'] = $pending['phone'];
    write_json('accounts.json', $accounts);
    $_SESSION['user']['username'] = $pending['username'];
    $_SESSION['user']['phone'] = $pending['phone'];
    unset($_SESSION['pending_profile_update']);
    json_response(['ok' => true, 'message' => 'Xác nhận OTP và cập nhật thông tin thành công.', 'user' => $_SESSION['user']]);
}

if ($action === 'request-delete') {
    require_post();
    $user = require_login();
    if (($user['role'] ?? '') === 'admin') {
        json_response(['ok' => false, 'message' => 'Không thể xóa tài khoản quản trị.'], 403);
    }

    $otp = (string) random_int(100000, 999999);
    $mailResult = send_otp_email($user['email'], $otp);
    if (!$mailResult['sent']) {
        json_response(['ok' => false, 'message' => 'Không thể gửi email OTP. Hãy kiểm tra App Password Gmail trong api/config.php.'], 503);
    }
    $_SESSION['pending_account_deletion'] = [
        'username' => $user['username'],
        'email' => $user['email'],
        'otp_hash' => password_hash($otp, PASSWORD_DEFAULT),
        'expires_at' => time() + 600,
    ];
    json_response(['ok' => true, 'message' => "Mã xác nhận xóa tài khoản đã được gửi tới {$user['email']}."]);
}

if ($action === 'verify-delete') {
    require_post();
    $user = require_login();
    $otp = trim((string) ($body['otp'] ?? ''));
    $pending = $_SESSION['pending_account_deletion'] ?? null;
    if (!$pending || time() > (int) ($pending['expires_at'] ?? 0)) {
        unset($_SESSION['pending_account_deletion']);
        json_response(['ok' => false, 'message' => 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.'], 422);
    }
    if (($pending['email'] ?? '') !== $user['email'] || ($pending['username'] ?? '') !== $user['username']) {
        unset($_SESSION['pending_account_deletion']);
        json_response(['ok' => false, 'message' => 'Yêu cầu xóa tài khoản không hợp lệ.'], 422);
    }
    if (!password_verify($otp, $pending['otp_hash'])) {
        json_response(['ok' => false, 'message' => 'Mã OTP không đúng.'], 422);
    }

    $accounts = read_json('accounts.json');
    $filteredAccounts = array_values(array_filter($accounts, static function (array $account) use ($user): bool {
        return !(strcasecmp($account['username'], $user['username']) === 0 && strcasecmp($account['email'], $user['email']) === 0);
    }));
    if (count($filteredAccounts) === count($accounts)) {
        unset($_SESSION['pending_account_deletion']);
        json_response(['ok' => false, 'message' => 'Không tìm thấy tài khoản để xóa.'], 404);
    }
    if (!write_json('accounts.json', $filteredAccounts)) {
        json_response(['ok' => false, 'message' => 'Không thể xóa tài khoản lúc này.'], 500);
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    json_response(['ok' => true, 'message' => 'Tài khoản đã được xóa thành công.', 'redirect' => 'index.html']);
}

if ($action === 'logout') {
    require_post();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    json_response(['ok' => true]);
}

if ($action === 'change-password') {
    require_post();
    $user = require_login();
    $oldPassword = (string) ($body['old_password'] ?? '');
    $newPassword = (string) ($body['new_password'] ?? '');
    $confirmPassword = (string) ($body['confirm_password'] ?? '');
    $accounts = read_json('accounts.json');
    $accountIndex = null;
    foreach ($accounts as $index => $account) {
        if (strcasecmp($account['username'], $user['username']) === 0) {
            $accountIndex = $index;
            break;
        }
    }
    if ($accountIndex === null || !password_verify($oldPassword, $accounts[$accountIndex]['password_hash'])) {
        json_response(['ok' => false, 'message' => 'Mật khẩu hiện tại không đúng.'], 422);
    }
    if (strlen($newPassword) < 8 || strlen($newPassword) > 20) {
        json_response(['ok' => false, 'message' => 'Mật khẩu mới phải có từ 8 đến 20 ký tự.'], 422);
    }
    if ($newPassword !== $confirmPassword) {
        json_response(['ok' => false, 'message' => 'Mật khẩu mới xác nhận không trùng khớp.'], 422);
    }
    $accounts[$accountIndex]['password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
    write_json('accounts.json', $accounts);
    json_response(['ok' => true, 'message' => 'Đổi mật khẩu thành công.']);
}

json_response(['ok' => false, 'message' => 'Tác vụ không tồn tại.'], 404);
