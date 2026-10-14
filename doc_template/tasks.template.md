# 📅 Task Breakdown: [Tên Tính Năng] (`<feature-id>`)

> **Version:** `1`

> ⚠️ **HƯỚNG DẪN DÀNH CHO CLAUDE CODE (PROMPT DIRECTIVE):**
> - **Quy Tắc Thứ Tự Thực Thi DAG 7 Tầng Bắt Buộc (MANDATORY DAG ORDER):**
>   1. **Phase 1 (Backend - Tier 1 ➔ 3):** DB Schema ➔ TypeBox Models ➔ Elysia Autoload Route.
>   2. **Phase 2 (Typegen Bridge - Tier 4 ⚠️ BẮT BUỘC):** Chạy `bun run dev gen:types` để sinh tĩnh `routes-types.ts`. **TUYỆT ĐỐI KHÔNG SANG PHASE 3 NẾU CHƯA XONG PHASE 2**.
>   3. **Phase 3 (Frontend - Tier 5 ➔ 6):** async-store Hooks (`.unWrapResponse`) ➔ UI Components & Router registration.
>   4. **Phase 4 (E2E Verification - Tier 7):** `xdev verify --changed --gate-check` ➔ `xdev spec:sync`.
> - **Nguyên Tắc Gắn Neo File 100%:** Toàn bộ các dòng task `- [ ]` phải chỉ định rõ đường dẫn file mã nguồn cụ thể hoặc câu lệnh CLI rõ ràng.
> - **Đồng Bộ Hai Chiều Với Thiết Kế (Atomic Tasks Sync):** Sau khi `tasks.md` được lưu chính thức, hệ thống tự động cập nhật cờ trên Metadata Header của `design.md` thành `Tasks Status: [Planned ✔️: YYYY-MM-DD]`.
> - **Khi Thiết Kế Có Version Mới (RE-PLANNING WITH DIVIDER `---`):**
>   1. Kế hoạch mới được lập hoàn toàn dựa trên `design.md` mới và code thực tế trong workspace (KHÔNG dùng danh sách task cũ).
>   2. **Xóa bỏ triệt để** mọi task chưa làm (`- [ ]`) của version cũ.
>   3. **Giữ nguyên** các task đã làm (`- [x]`) đưa lên trên đường phân cách `---` làm nhật ký lịch sử (`## Completed Execution History`).
>   4. **Tuyệt đối không dùng cờ cấm `REPLACED` hay `INVALIDATED`**. Việc dọn dẹp code cũ được viết thành task mới: `Task X.Y: [Refactor/Cleanup]...` nằm ở Tầng 0 dưới đường phân cách `---`.
>   5. Công thức tính % tiến độ: Chỉ tính trên các active tasks **bên dưới đường phân cách `---`**.

---

## Phase 1: Backend Implementation (DAG Tier 1-3)
- [ ] Task 1.1: [DB Schema] Định nghĩa Drizzle table schema trong `apps/backend/src/db/schema/<feature>-schema.ts`
- [ ] Task 1.2: [Models] Tạo TypeBox validation schemas (select, insert, update) trong `apps/backend/src/models/<feature>.ts`
- [ ] Task 1.3: [API Route] Xây dựng Elysia autoload route trong `apps/backend/src/routes/<feature>.ts` với đầy đủ `detail.authType` và model validation

## Phase 2: Static Route Types Generation ⚠️ (DAG Tier 4 - Pivot Bridge)
- [ ] Task 2.1: [Typegen Bridge] Chạy lệnh `bun run dev gen:types` để tái sinh tĩnh `apps/backend/src/routes-types.ts`
*(Chốt chặn an toàn: Tuyệt đối không bắt đầu Phase 3 nếu Phase 2 chưa hoàn thành)*

## Phase 3: Frontend Implementation (DAG Tier 5-6)
- [ ] Task 3.1: [Store] Khởi tạo Query Keys và TanStack Query hooks trong `apps/frontend/src/async-store/<feature>.ts` sử dụng `.unWrapResponse()`
- [ ] Task 3.2: [UI] Xây dựng trang giao diện chính với Ant Design v5 trong `apps/frontend/src/pages/<feature>/index.tsx`
- [ ] Task 3.3: [UI Modal/Drawer] Xây dựng component tương tác chi tiết trong `apps/frontend/src/pages/<feature>/<feature>-form-modal.tsx`
- [ ] Task 3.4: [Routing] Đăng ký router path trong cấu hình điều hướng React Router

## Phase 4: E2E Verification & Progress Sync (DAG Tier 7)
- [ ] Task 4.1: [Verification] Chạy kiểm định cơ học: `xdev verify --changed --gate-check --feature <feature-id>`
- [ ] Task 4.2: [Roadmap Sync] Đồng bộ trạng thái tiến độ lên Roadmap: `xdev spec:sync <feature-id>`

---

<!--
====================================================================================
VÍ DỤ MINH HỌA KHI TÁI LẬP KẾ HOẠCH CHO DESIGN VERSION 2 (RE-PLANNING WITH DIVIDER):
Khi design.md được nâng lên Version 2, file tasks.md sẽ có cấu trúc như sau:

> **Version:** `2`  

## Completed Execution History (v1)
- [x] Task 1.1: [DB Schema] Tạo bảng dữ liệu cơ sở ban đầu trong apps/backend/src/db/schema/<feature>-schema.ts
- [x] Task 1.2: [Models] Tạo TypeBox models ban đầu

---

## Active Execution Plan (v2)
### Phase 1: Backend Refactor & Updates
- [ ] Task 2.1: [Refactor/Cleanup] Gỡ bỏ cột logic cũ theo design.md v2 trong apps/backend/src/db/schema/<feature>-schema.ts
- [ ] Task 2.2: [DB Schema] Bổ sung bảng quan hệ mới theo thiết kế v2
- [ ] Task 2.3: [API Route] Cập nhật endpoint với phân quyền authType: 2 trong apps/backend/src/routes/<feature>.ts

### Phase 2: Static Route Types Generation ⚠️
- [ ] Task 2.4: [Typegen Bridge] Chạy bun run dev gen:types để sinh routes-types.ts

### Phase 3: Frontend Implementation
- [ ] Task 2.5: [Store] Cập nhật hook TanStack Query trong apps/frontend/src/async-store/<feature>.ts
- [ ] Task 2.6: [UI] Cập nhật giao diện Ant Design v5 trong apps/frontend/src/pages/<feature>/index.tsx

### Phase 4: E2E Verification & Progress Sync
- [ ] Task 2.7: [Verification] Chạy xdev verify --changed --gate-check --feature <feature-id>
- [ ] Task 2.8: [Roadmap Sync] Chạy xdev spec:sync <feature-id>
====================================================================================
-->
