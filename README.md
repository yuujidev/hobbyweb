# ERIFTverse – Hobby Web

Website giới thiệu và kết nối cộng đồng yêu thích figure, Gunpla và model kit. Dự án gồm trang giới thiệu, danh mục sản phẩm, cộng đồng thảo luận, tài khoản người dùng và khu vực quản trị.

## Chức năng chính

### 1. Trang chủ
- Giới thiệu ERIFTverse và các khu vực chính của website.
- Hiển thị nội dung/những sản phẩm nổi bật.
- Có biểu mẫu đăng sản phẩm với tên, danh mục, giá tham khảo, mô tả, liên kết và ảnh xem trước (PNG/JPG/WEBP, tối đa 5 MB theo giao diện).

### 2. Danh sách sản phẩm
- Trang tổng hợp sản phẩm được đăng.
- Hiển thị thông tin sản phẩm và liên kết tham khảo/mua hàng.

### 3. Danh mục model kit
- Hiển thị các model kit với tên, thương hiệu, dòng sản phẩm, giá, mô tả, ảnh và liên kết.
- Có một số model mẫu mặc định để minh họa khi dữ liệu chưa có.

### 4. Cộng đồng
- Tạo chủ đề với tên hiển thị, danh mục, tiêu đề và nội dung.
- Hỗ trợ các loại nội dung như hỏi đáp, khoe build và mua bán/trao đổi.
- Với bài đăng phù hợp, có thể thêm liên kết sản phẩm, ảnh, giá và tùy chọn giá thương lượng.
- Hiển thị danh sách chủ đề, phân trang (20 chủ đề mỗi trang trong mã hiện tại).
- Dữ liệu thảo luận phía trình duyệt được lưu bằng `localStorage`; vì vậy đây chưa phải hệ thống diễn đàn dùng cơ sở dữ liệu tập trung.

### 5. Tài khoản người dùng
- Đăng ký bằng username và Gmail; số điện thoại là tùy chọn.
- Xác minh email bằng mã OTP 6 chữ số.
- Đăng nhập bằng username hoặc Gmail.
- Xem và chỉnh sửa thông tin cá nhân (username, số điện thoại); thay đổi cần xác minh OTP theo luồng ứng dụng.
- Đổi mật khẩu.
- Yêu cầu xóa tài khoản thông qua xác minh OTP.
- Đăng xuất.

### 6. Quản trị model kit
- Khu vực quản trị dành cho tài khoản có quyền admin.
- Thêm model kit: tên, thương hiệu, dòng sản phẩm, giá, liên kết, ảnh và mô tả.
- Xem danh sách model do admin quản lý và gỡ model khỏi danh sách công khai.

## Công nghệ sử dụng

- HTML5
- CSS3
- JavaScript (Fetch API, DOM, `localStorage`)
- PHP
- JSON để lưu dữ liệu ứng dụng
- PHPMailer và Gmail SMTP để gửi mã OTP
- XAMPP/Apache và PHP để chạy môi trường local

## Cấu trúc thư mục

```text
duan1/
├── admin/       # Giao diện quản trị
├── api/         # API PHP: xác thực, model kit, cấu hình và gửi mail
├── auth/        # Đăng nhập/đăng ký, hồ sơ, bảo mật
├── community/   # Giao diện cộng đồng
├── data/        # Dữ liệu JSON runtime (không đưa dữ liệu riêng tư lên Git)
├── home/        # Trang chủ
├── list/        # Danh sách sản phẩm
├── models/      # Danh mục model kit
├── script/      # JavaScript phía trình duyệt
├── style/       # CSS
├── vendor/      # Thư viện PHPMailer
├── index.html   # Điểm vào trang web
└── SMTP_SETUP.md
```

## Cài đặt và chạy bằng XAMPP

1. Cài XAMPP có Apache và PHP.
2. Đặt thư mục dự án vào `C:\xampp\htdocs\duan1`.
3. Mở XAMPP Control Panel và khởi động **Apache**.
4. Truy cập:
   - `http://localhost/duan1/`
   - Hoặc `http://localhost/duan1/home/`
5. Các API PHP cần được chạy qua Apache/PHP; không mở trực tiếp file HTML bằng `file://`.

## Cấu hình email OTP

Ứng dụng sử dụng Gmail SMTP để gửi OTP. Hãy cấu hình thông tin SMTP trong `api/config.php` trên máy triển khai, dùng Google App Password và không dùng mật khẩu Gmail thông thường.

**Không commit mật khẩu, App Password, thông tin tài khoản quản trị hoặc dữ liệu người dùng vào GitHub.** Nên đưa cấu hình bí mật ra biến môi trường hoặc file cấu hình riêng không được Git theo dõi. Xem thêm `SMTP_SETUP.md`.

## Dữ liệu và triển khai

- Ứng dụng đọc/ghi dữ liệu JSON trong thư mục `data/`.
- Các file dữ liệu runtime cần quyền đọc/ghi phù hợp cho PHP.
- `localStorage` của trình duyệt được dùng cho một số dữ liệu giao diện cộng đồng; dữ liệu này gắn với trình duyệt hiện tại, không tự đồng bộ giữa người dùng/thiết bị.
- Đây là mô tả dựa trên mã nguồn hiện có; cần kiểm thử trên môi trường triển khai trước khi đưa vào sử dụng thực tế.

## Bảo mật

- Không công khai file chứa mật khẩu, SMTP App Password, OTP hoặc dữ liệu cá nhân.
- Nếu thông tin bí mật từng được commit lên repository, xóa file ở commit mới **không xóa bí mật khỏi lịch sử Git**. Hãy thu hồi/đổi các thông tin đó và xử lý lịch sử repository nếu cần.
- Không dùng thông tin đăng nhập mẫu trong môi trường thật; cấu hình lại thông tin quản trị an toàn trước khi triển khai.

## Giấy phép

Chưa xác định giấy phép phân phối cho mã nguồn của dự án.

