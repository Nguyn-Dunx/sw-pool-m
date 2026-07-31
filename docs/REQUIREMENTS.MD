# TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ (BUSINESS REQUIREMENTS)
**Dự án:** Hệ thống Quản lý Bể bơi (Pool Management System)
**Nền tảng:** Web Application (Mobile-first design)
**Kiến trúc:** Modular Monolith (Spring Boot) + ReactJS + PostgreSQL + Docker

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Hệ thống được thiết kế để số hóa quy trình quản lý học viên tại bể bơi, thay thế cho sổ sách thủ công. Điểm khác biệt cốt lõi của hệ thống là triết lý **"Teacher-Centric" (Lấy giáo viên làm trung tâm)**. Thay vì quản lý theo lớp học cố định, hệ thống cho phép học viên lịch hoạt thời gian, và giáo viên sẽ trực tiếp quản lý, theo dõi tiến độ, điểm danh học viên của mình ngay tại thành bể bằng điện thoại.

## 2. CÁC LUỒNG NGHIỆP VỤ CỐT LÕI (CORE BUSINESS LOGIC)

### 2.1. Nghiệp vụ Khóa học & Tiến độ (Core Rule)
*   **Thời hạn (Deadline):** Mỗi khóa học mặc định có thời hạn sử dụng là **45 ngày** kể từ ngày đăng ký. Quá 45 ngày, trạng thái tự động chuyển thành `EXPIRED`.
*   **Định mức buổi học (Quota):** Mặc định **12 buổi / khóa**. Mỗi lần điểm danh sẽ trừ đi 1 buổi.
*   **Chính sách Cam kết (Guarantee):** 
    *   Nếu học viên thuộc diện "Không cam kết": Hết 12 buổi là kết thúc (`COMPLETED`).
    *   Nếu học viên thuộc diện "Có cam kết": Sau 12 buổi chưa biết bơi, hệ thống vẫn cho phép điểm danh các buổi tiếp theo (buổi 13, 14...) nhưng hiển thị cảnh báo (UI highlight) để quản lý biết học viên này đang học bù.

### 2.2. Nghiệp vụ Phân bổ Giáo viên (Teacher Assignment)
*   Không áp dụng mô hình "1 Lớp - 1 Thầy cố định" cứng nhắc.
*   Một học viên có thể học 1 thầy (1-1) hoặc học chung nhóm (1-2, 1-5).
*   **Đồng giảng (Co-teaching):** Một học viên có thể được gán cho nhiều giáo viên cùng lúc (Ví dụ: Thầy Phong và Thầy Lộc cùng quản lý 1 học viên). Khi đó, học viên này sẽ xuất hiện trên màn hình Dashboard của cả 2 thầy.

### 2.3. Nghiệp vụ Điểm danh linh hoạt (Flexible Attendance)
*   Học viên **không bị cố định ca học**. Hệ thống chỉ định nghĩa sẵn các Ca học (Shifts) như 6h-7h, 14h-15h.
*   Học viên rảnh giờ nào đến bơi giờ đó. Giáo viên phụ trách ca đó sẽ thực hiện điểm danh.
*   **Quy tắc:** 1 học viên không thể bị điểm danh đúp 2 lần trong cùng 1 ca của cùng 1 ngày (Database Constraint).

---

## 3. PHÂN QUYỀN HỆ THỐNG (RBAC - ROLE BASED ACCESS CONTROL)
Hệ thống sử dụng cơ chế **Session-based Authentication** chia làm 2 quyền chuyên biệt:

1.  **ROLE_ADMIN (Chủ bể bơi):**
    *   Có toàn quyền quản trị hệ thống (Full CRUD).
    *   Xem được số liệu tổng quan của toàn bộ cơ sở (Tổng học viên, tổng giáo viên, doanh thu/tiến độ chung).
2.  **ROLE_TEACHER (Giáo viên):**
    *   Chỉ xem được danh sách học viên do mình quản lý.
    *   Thực hiện thao tác điểm danh và ghi chú cho học viên của mình.
    *   Theo dõi tiến độ, xem lịch sử điểm danh của học viên.

---

## 4. DANH SÁCH CHỨC NĂNG CHI TIẾT (FEATURE BREAKDOWN)

### Module 1: Xác thực & Tài khoản (IAM - Identity & Access Management)
*   [ ] Đăng nhập bằng Số điện thoại và Mật khẩu (Mã hóa BCrypt).
*   [ ] Duy trì trạng thái đăng nhập qua HTTPOnly Cookie (Chống XSS).
*   [ ] Đăng xuất và hủy Session an toàn.

### Module 2: Bảng điều khiển (Dashboard)
*   [ ] **Admin Dashboard:** Thống kê tổng quan số lượng Học viên đang Active, số lượng Giáo viên, danh sách các khóa học sắp hết hạn.
*   [ ] **Teacher Dashboard:** Hiển thị tổng sĩ số học viên đang quản lý. Danh sách học viên sắp xếp theo độ ưu tiên (Sắp hết hạn lên đầu).

### Module 3: Quản lý Quản trị viên (Admin Operations)
*   [ ] **Quản lý Giáo viên:** Thêm mới (tự động tạo tài khoản user), sửa thông tin, khóa tài khoản (Inactive).
*   [ ] **Quản lý Học viên:** Tạo mới hồ sơ học viên, phân loại nguồn khách (Khách tự đến / Khách do giáo viên giới thiệu).
*   [ ] **Quản lý Khóa học:** 
    *   Tạo khóa học mới cho học viên (chọn kiểu bơi, có/không cam kết).
    *   Gán giáo viên phụ trách cho khóa học (Có thể gán nhiều giáo viên).

### Module 4: Thao tác của Giáo viên (Teacher Operations)
*   [ ] **Xem danh sách học viên:** Giao diện thẻ (Card) hiển thị Tên, Tuổi, Kiểu bơi, Thanh tiến trình (Progress Bar: 8/12 buổi).
*   [ ] **Điểm danh (Check-in):** Thao tác nhanh (1-click), chọn ca học hiện tại, điền ghi chú tình trạng buổi học (ví dụ: "Nhát nước", "Bơi tốt").
*   [ ] **Xem chi tiết hồ sơ:** Xem lịch sử tất cả các buổi đã đi bơi của 1 học viên cụ thể kèm theo ghi chú của từng buổi.

### Module 5: Hệ thống Cảnh báo tự động (Alerts & Cronjobs)
*   [ ] **Cảnh báo sắp hết hạn:** Tự động highlight đỏ/cam các học viên có thẻ `expire_date` còn dưới 5 ngày.
*   [ ] **Cảnh báo vắng mặt:** Quét tìm các học viên đã quá 7 ngày chưa phát sinh dữ liệu điểm danh mới để giáo viên gọi điện nhắc nhở.
*   [ ] **Tự động hết hạn (Cronjob System):** Job chạy ngầm lúc 0h00 mỗi ngày, tự động quét và chuyển trạng thái `status` thành `EXPIRED` cho các khóa học quá 45 ngày.

---

## 5. BẢO ĐẢM TÍNH TOÀN VẸN DỮ LIỆU (DATA INTEGRITY)
*   **Soft Delete:** Áp dụng xóa mềm (`deleted_at`) trên tất cả các bảng nghiệp vụ cốt lõi (Users, Teachers, Students, Enrollments, Attendance). Đảm bảo Admin có thể tra soát vết khi có sự cố.
*   **Database Constraints:** Mọi ràng buộc tính toán (thời hạn bắt buộc lớn hơn ngày bắt đầu, giới hạn quyền) đều được bọc bởi Database Rule, ngăn chặn triệt để rác dữ liệu từ tầng Backend.