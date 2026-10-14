# 🏛️ Technical Design: [Tên Tính Năng] (`<feature-id>`)

> **Version:** `1`  
> **Tasks Status:** `[Pending-Tasks ⚠️ | Planned ✔️: YYYY-MM-DD]`

> ⚠️ **HƯỚNG DẪN DÀNH CHO CLAUDE CODE (PROMPT DIRECTIVE):**
> - **Nguyên Tắc Bản Vẽ Sống (Living Blueprint):** Tài liệu này là Single Source of Truth cho toàn bộ kiến trúc kỹ thuật. **TUYỆT ĐỐI KHÔNG APPEND REVISION XUỐNG DƯỚI**. Mọi điều chỉnh kiến trúc (schemas, models, routes, hooks, UI) đều được **CẬP NHẬT TRỰC TIẾP TẠI CHỖ (IN-PLACE)**.
> - **Khi Yêu Cầu Thay Đổi (Requirements Revision) hoặc Tái Cấu Trúc (Refactoring):**
>   1. Cập nhật thiết kế tại các mục 1-6 để khớp với yêu cầu hoặc kiến trúc mới nhất.
>   2. Nâng số `Version: <N+1>` và đặt cờ `Tasks Status: [Pending-Tasks ⚠️]` ở Header.
>   3. Cập nhật lại Section 7 `Traceability Matrix`: Bổ sung touchpoints cho story mới `[ADDED]`, cập nhật cho story `[MODIFIED]`, xóa bỏ ánh xạ của story `[DEPRECATED]`.
>   4. **Cam kết 100% độ phủ:** Mọi `US-XX` phải trỏ đến file cụ thể. **TUYỆT ĐỐI CẤM DÙNG PLACEHOLDER `...`**.
>   5. Sau khi lưu file thành công, tự động kích hoạt **Atomic Design Sync** đổi cờ trên Metadata Header của `requirements.md` thành `[Designed ✔️: YYYY-MM-DD]`.

---

## 1. Architecture Overview & Tech Stack Fit
- **Mô hình Kiến trúc:** [Tóm tắt luồng dữ liệu E2E từ Frontend (React 19 + Ant Design v5) ➔ Eden Treaty Client ➔ Backend (Elysia Autoload Route + Drizzle ORM + PostgreSQL)]
- **Biểu đồ Luồng Dữ Liệu (Data Flow):**
  ```text
  [Client: Antd UI] ──> [use<Feature>Query / Mutation] ──> [Eden Treaty (.unWrapResponse)]
                                                                    │
  [PostgreSQL] <── [Drizzle Schema] <── [Route Handler (authType)] <┘
  ```

---

## 2. Database Schema (`apps/backend/src/db/schema/`)
- **Tệp định nghĩa:** `apps/backend/src/db/schema/<feature>-schema.ts`
```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "../columns-helpers";

export const exampleTable = pgTable("example", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  ...createdAt,
  ...updatedAt,
});
```

---

## 3. Validation Models (`apps/backend/src/models/`)
- **Tệp định nghĩa:** `apps/backend/src/models/<feature>.ts`
```ts
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-typebox";
import { t } from "elysia";
import { exampleTable } from "../db/schema/example-schema";

export const selectExampleSchema = createSelectSchema(exampleTable);
export const insertExampleSchema = createInsertSchema(exampleTable, {
  name: t.String({ minLength: 1, maxLength: 255 }),
});
export const updateExampleSchema = createUpdateSchema(exampleTable);

export const queryExampleSchema = t.Object({
  page: t.Optional(t.Numeric({ default: 1 })),
  limit: t.Optional(t.Numeric({ default: 20 })),
});
```

---

## 4. API Endpoints & Autoload Routes (`apps/backend/src/routes/`)
- **Tệp định nghĩa:** `apps/backend/src/routes/<feature>.ts`
- **Quy chuẩn Autoload Route Handler:**
```ts
import { Elysia, t } from "elysia";
import { insertExampleSchema, selectExampleSchema } from "../models/<feature>";

export default new Elysia({ prefix: "/<feature>" })
  .get("/", async ({ db }) => {
    // Implementation logic
    return { data: [] };
  }, {
    response: t.Object({ data: t.Array(selectExampleSchema) }),
    detail: {
      summary: "Lấy danh sách dữ liệu",
      tags: ["<Feature>"],
      authType: 1, // 0: Public | 1: Authenticated | 2: Authorized/RBAC
    },
  })
  .post("/", async ({ body, db }) => {
    // Implementation logic
    return { success: true };
  }, {
    body: insertExampleSchema,
    detail: {
      summary: "Tạo mới dữ liệu",
      tags: ["<Feature>"],
      authType: 2, // Yêu cầu RBAC
    },
  });
```

---

## 5. Eden Treaty & Frontend Integration (`apps/frontend/src/async-store/`)
- **Tệp Query Keys Factory:** `apps/frontend/src/async-store/query-keys.ts`
- **Tệp Custom Hook:** `apps/frontend/src/async-store/<feature>.ts`
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { treatyClient } from "../api-client";
import { queryKeys } from "./query-keys";

export const useGet<Feature>ListQuery = () => {
  return useQuery({
    queryKey: queryKeys.<feature>.list(),
    queryFn: async () => {
      const res = await treatyClient.<feature>.get();
      return res.unWrapResponse();
    },
  });
};

export const useCreate<Feature>Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const res = await treatyClient.<feature>.post(payload);
      return res.unWrapResponse();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.<feature>.all });
    },
  });
};
```

---

## 6. Frontend UI Components (`apps/frontend/src/pages/<feature>/`)
- **Tệp Trang Chính:** `apps/frontend/src/pages/<feature>/index.tsx`
- **Thành phần Ant Design v5 sử dụng:** `Table`, `Form`, `Modal`, `Button`, `Card`, `Space`, `notification`.
- **Trạng thái Giao diện (UI States):**
  - *Loading:* Skeleton / Spin khi query đang fetch.
  - *Empty State:* `Empty` component khi danh sách rỗng.
  - *Error State:* `Alert` hoặc `Result` báo lỗi và nút Retry.
  - *Success / Mutation Feedback:* Antd `message.success()` hoặc `notification.success()`.

---

## 7. Code Touchpoints & Traceability Matrix (Ma Trận Điểm Chạm)

> ⚠️ **QUY TẮC BẤT BIẾN CỦA AST AUDIT (100% COVERAGE - ZERO PLACEHOLDER `...`):**  
> Mỗi User Story (`US-XX`) từ `requirements.md` **bắt buộc phải có dòng tương ứng trỏ tới file cụ thể**. Tuyệt đối cấm sử dụng placeholder `...` hoặc để trống đường dẫn.

| Requirement ID | Backend Schema | API Route Handler | Frontend Async Store | UI Component |
| :--- | :--- | :--- | :--- | :--- |
| `US-01` | `apps/backend/src/db/schema/<feature>-schema.ts` | `apps/backend/src/routes/<feature>.ts` | `apps/frontend/src/async-store/<feature>.ts` | `apps/frontend/src/pages/<feature>/index.tsx` |
| `US-02` | `apps/backend/src/db/schema/<feature>-schema.ts` | `apps/backend/src/routes/<feature>.ts` | `apps/frontend/src/async-store/<feature>.ts` | `apps/frontend/src/pages/<feature>/<feature>-form-modal.tsx` |
| `US-03` | `apps/backend/src/db/schema/<feature>-schema.ts` | `apps/backend/src/routes/<feature>.ts` | `apps/frontend/src/async-store/<feature>.ts` | `apps/frontend/src/pages/<feature>/<feature>-detail-drawer.tsx` |
