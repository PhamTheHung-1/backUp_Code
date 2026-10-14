# 📋 Requirements Specification: [Tên Tính Năng] (`<feature-id>`)

> **Version:** `1`  
> **Design Status:** `[Pending-Design ⚠️ | Designed ✔️: YYYY-MM-DD]`  
> **Milestone:** `[M1-MVP | M2-Growth | M3-Scale]` | **Priority:** `[P0 | P1 | P2]`

---

## 1. Feature Overview & Business Objectives
- **Bài toán Cốt lõi (Problem Statement):** [Mô tả ngắn gọn 1-2 câu về vấn đề nghiệp vụ hoặc nỗi đau mà tính năng này giải quyết]
- **Người Thụ Hưởng Trọng Tâm (Primary Beneficiary):** [Chân dung người dùng từ vision.md — ví dụ: Chủ doanh nghiệp / Quản trị viên / Khách vãng lai]
- **Giá trị Mang lại (Expected Business Outcome):** [Kết quả định tính hoặc định lượng mong đợi sau khi tính năng được phát hành]

---

## 2. User Stories & Requirements Scope
- **`US-01`:** As a `[user role]`, I want to `[thực hiện hành động]`, so that `[đạt được mục tiêu mong muốn]`. *(authType: `[0 | 1 | 2]`)*
- **`US-02`:** As a `[user role]`, I want to `[thực hiện hành động]`, so that `[đạt được mục tiêu mong muốn]`. *(authType: `[0 | 1 | 2]`)*
- **`US-03`:** As a `[user role]`, I want to `[thực hiện hành động]`, so that `[đạt được mục tiêu mong muốn]`. *(authType: `[0 | 1 | 2]`)*

---

## 3. Acceptance Criteria (Gherkin Scenarios)

### `US-01`: [Tên tóm tắt User Story 1]
- **Scenario 1 (Happy Path):**
  - **Given:** [Trạng thái ban đầu / Tiền điều kiện hợp lệ]
  - **When:** [Người dùng kích hoạt hành động hoặc gửi dữ liệu]
  - **Then:** [Hệ thống phản hồi thành công và cập nhật trạng thái dữ liệu chính xác]
- **Scenario 2 (Validation Error / Failure):**
  - **Given:** [Dữ liệu đầu vào không hợp lệ hoặc thiếu thông tin bắt buộc]
  - **When:** [Người dùng cố gắng gửi yêu cầu]
  - **Then:** [Hệ thống chặn lại, trả về mã lỗi thích hợp và hiển thị thông báo lỗi rõ ràng]

### `US-02`: [Tên tóm tắt User Story 2]
- **Scenario 1 (Happy Path):**
  - **Given:** [Tiền điều kiện hợp lệ]
  - **When:** [Người dùng thực hiện thao tác]
  - **Then:** [Kết quả mong đợi]
- **Scenario 2 (Edge Case / Security Check):**
  - **Given:** [Người dùng chưa đăng nhập hoặc không đủ thẩm quyền]
  - **When:** [Cố gắng truy cập tài nguyên]
  - **Then:** [Hệ thống từ chối với mã lỗi 401 Unauthorized hoặc 403 Forbidden]

---

## 4. Security & Permissions (`authType`)
- **Phân loại Cấp độ Xác thực & Phân quyền:**
  - `authType: 0 (Public)`: Khách vãng lai, không yêu cầu phiên đăng nhập.
  - `authType: 1 (Authenticated)`: Người dùng đã đăng nhập hợp lệ (phiên session/JWT còn hạn).
  - `authType: 2 (Authorized / RBAC)`: Yêu cầu vai trò (Role) hoặc quyền hạn (Permission) cụ thể.
- **Bảng Phân Quyền Chi Tiết (Role Matrix):**
  | User Story | Quyền Hạn / Vai Trò Yêu Cầu | Cấp độ `authType` | Ghi chú Bảo Mật |
  | :--- | :--- | :--- | :--- |
  | `US-01` | `[Public / Anonymous]` | `0` | Rate limiting: 60 requests/phút |
  | `US-02` | `[User / Customer]` | `1` | Session Cookie HttpOnly |
  | `US-03` | `[Admin / Manager]` | `2` | Kiểm tra role `ADMIN` tại middleware |

---

## 5. Non-Functional Requirements & Strategic Boundaries

### 5.1. Non-Functional Requirements (Chất Lượng Vận Hành)
- **Hiệu năng (Performance SLA):** Thời gian phản hồi API P95 < 200ms đối với tải thông thường.
- **Bảo mật & Giới hạn tần suất (Rate Limiting):** Tối đa [X] requests/phút trên mỗi địa chỉ IP.
- **Nhật ký kiểm toán (Audit Logging):** Ghi nhận đầy đủ vết thay đổi trạng thái đối với các hành động trọng yếu.

### 5.2. Strategic Non-Goals & Boundaries ⚠️ (Ranh Giới Chiến Lược)
> **Nguyên tắc bảo vệ phạm vi MVP:** Những nội dung dưới đây **TUYỆT ĐỐI KHÔNG LÀM** trong phiên bản hiện tại để tránh phình tính năng (Feature Creep):
- ❌ **Non-Goal 1:** [Ví dụ: KHÔNG hỗ trợ tùy biến giao diện động trong phiên bản này]
- ❌ **Non-Goal 2:** [Ví dụ: KHÔNG tích hợp cổng thanh toán quốc tế thứ ba; chỉ tập trung VietQR]
- ❌ **Non-Goal 3:** [Ranh giới nghiệp vụ ngoài phạm vi khác]

---

## 6. Revision History & Requirements Deltas

> ⚠️ **HƯỚNG DẪN DÀNH CHO CLAUDE CODE (PROMPT DIRECTIVE):**
> - **Khi Khởi tạo lần đầu (Version 1 - Baseline):**
>   - Dừng lại ở hết Mục 5. **TUYỆT ĐỐI KHÔNG SINH MỤC 6** cho bản khởi tạo Version 1.
>   - Thiết lập Metadata Header: `Version: 1`, `Design Status: [Pending-Design ⚠️]`.
> - **Khi Điều chỉnh Yêu cầu Nghiệp vụ (Requirements Revision):**
>   1. **Kiểm tra cờ `Design Status` trên Metadata Header:**
>      - **Trường hợp A - Revision Folding (Nếu đang là `Pending-Design ⚠️`):**
>        - Đợt thay đổi trước đó chưa được thiết kế. **GỘP TRỰC TIẾP** nội dung mới vào khối Revision hiện tại trong Mục 6.
>        - Cập nhật `Business Rationale`, gộp `Requirements Deltas`, và làm mới khối `Context Handoff for Technical Design`.
>        - **GIỮ NGUYÊN số `Version`** và giữ nguyên cờ `Design Status: [Pending-Design ⚠️]` để tránh rác tài liệu.
>      - **Trường hợp B - Mở Revision mới (Nếu đang là `Designed ✔️`):**
>        - Nâng số `Version: <N+1>` và đổi cờ Header thành `Design Status: [Pending-Design ⚠️]`.
>        - Chèn khối Revision mới (`Revision <M>`) lên **ĐẦU** danh sách Mục 6 (hoặc tạo Mục 6 nếu file chưa có).
>   2. **Nguyên tắc 2 vùng độc lập:**
>      - **Mục 1 đến Mục 5 (Thân đặc tả):** Luôn cập nhật trực tiếp tại chỗ (In-Place Update) để phản ánh đầy đủ nghiệp vụ hiện tại (Current Truth). Lập trình viên / QA đọc tại đây.
>      - **Mục 6 (Revision History):** Chỉ tóm tắt ngắn gọn deltas kèm lý do (Business Rationale) và khối bàn giao kỹ thuật (Context Handoff). **TUYỆT ĐỐI KHÔNG CHÉP LẠI GHERKIN CHI TIẾT** vào Mục 6.
>   3. **Cú pháp Deltas chuẩn mực:**
>      - `**[ADDED]** US-XX: [Tên story] - [Mô tả tóm tắt 1 câu] (authType: [0|1|2]) ➔ Chi tiết xem tại Mục 2 & 3`
>      - `**[MODIFIED]** US-XX: [Tóm tắt nội dung thay đổi quy tắc kèm lý do]`
>      - `**[DEPRECATED]** US-XX: [Tên story cũ bị hủy bỏ kèm lý do]`

<!-- 
MỤC 6 DƯỚI ĐÂY CHỈ XUẤT HIỆN KHI CÓ REVISION (TỪ REVISION 1 TRỞ ĐI).
VÍ DỤ CẤU TRÚC KHI PHÁT SINH REVISION ĐẦU TIÊN:

### Revision 1 ([YYYY-MM-DD]) - [Tên Tóm Tắt Đợt Thay Đổi]
- **Target Version:** `Version 2`
- **Business Rationale:** [Lý do thay đổi nghiệp vụ - 1 đến 2 câu giải thích tại sao cần điều chỉnh]
- **Requirements Deltas:**
  - **[ADDED]** `US-04`: Đăng nhập bằng Email Magic Link (authType: 1) ➔ Chi tiết tại Mục 2 & 3
  - **[MODIFIED]** `US-02`: Đổi cơ chế OTP SMS sang Email OTP để tối ưu chi phí
  - **[DEPRECATED]** `US-03`: Hủy bỏ tính năng đăng nhập bằng số điện thoại
- **Context Handoff for Technical Design:**
  - **Entities & Data Models:** [Tóm tắt thực thể mới/sửa: bảng magic_tokens, cập nhật bảng users...]
  - **API Endpoints & Actions:** [POST /auth/magic-link, DELETE /auth/phone...]
  - **Side Effects & Events:** [Gửi email chứa magic link qua Resend, ghi audit log...]
-->
