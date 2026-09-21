# Cấu hình Gmail SMTP cho OTP

1. Đăng nhập Gmail `Gmail của bạn` và bật **2-Step Verification**.
2. Vào Google Account > Security > App passwords, tạo một App Password mới cho hobbyverse.
3. Mở `api/config.php` và dán App Password 16 ký tự vào dòng:

```php
const SMTP_PASSWORD = 'nhập SMTPPW';
```

4. Khi chạy thật, đổi:

```php
const APP_ENV = 'production';
```

SMTP đang dùng `smtp.gmail.com`, TLS, port `...`, người gửi là `Gmail của bạn`.

Không dùng mật khẩu Gmail thông thường. App Password không được đưa vào frontend hoặc commit lên repository.
