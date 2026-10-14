# Full-Stack Web Template (Bun Monorepo)

Monorepo full-stack phát triển ứng dụng web hiện đại tối ưu hiệu năng cao và **End-to-End Type Safety** từ Cơ sở dữ liệu (Database) đến Giao diện người dùng (UI):
- **Backend:** [Bun](https://bun.sh/) + [ElysiaJS](https://elysiajs.com/) + [Drizzle ORM](https://orm.drizzle.team/) + [TypeBox](https://github.com/sinclairzx81/typebox) (PostgreSQL) theo kiến trúc **Modular Screaming Architecture** phân tách 4 lớp (Schema, Repository, Service, Route), tích hợp **Verification Guardrails** (`arch:check`, `verify`, `test`) tối ưu hóa cho AI-Assisted Coding (Claude Code, Cursor, OpenCode).
- **Frontend:** [React 18](https://react.dev/) + [Eden Treaty](https://elysiajs.com/eden/treaty/overview.html) + [TanStack Query v5](https://tanstack.com/query/latest) + [Ant Design v5](https://ant.design/) + [Vite](https://vitejs.dev/) + [TailwindCSS](https://tailwindcss.com/)
- **Monorepo Tools:** Bun Workspaces (Package Catalog) + [Biome](https://biomejs.dev/)

---

## Mục lục

1. [Kiến trúc & Bản đồ Source Code](#1-kiến-trúc--bản-đồ-source-code)
   - [1.1 Cấu trúc Monorepo tổng quan](#11-cấu-trúc-monorepo-tổng-quan)
   - [1.2 Kiến trúc Phân tầng 4 lớp trong Backend (`src/modules/`)](#12-kiến-trúc-phân-tầng-4-lớp-trong-backend-srcmodules)
   - [1.3 Path Aliases quan trọng (`tsconfig.base.json`)](#13-path-aliases-quan-trọng-tsconfigbasejson)
2. [Cấu hình Môi trường (Environment Variables)](#2-cấu-hình-môi-trường-environment-variables)
   - [2.1 Nguyên tắc cấu hình & vị trí file](#21-nguyên-tắc-cấu-hình--vị-trí-file)
   - [2.2 Cấu hình Backend (`apps/backend`)](#22-cấu-hình-backend-appsbackend)
   - [2.3 Cấu hình Frontend (`apps/frontend`)](#23-cấu-hình-frontend-appsfrontend)
   - [2.4 Bảng chẩn đoán lỗi môi trường thường gặp](#24-bảng-chẩn-đoán-lỗi-môi-trường-thường-gặp)
3. [Hướng dẫn Khởi chạy & Các lệnh thường dùng](#3-hướng-dẫn-khởi-chạy--các-lệnh-thường-dùng)
   - [3.1 Các bước khởi chạy dự án từ đầu (First Run)](#31-các-bước-khởi-chạy-dự-án-từ-đầu-first-run)
   - [3.2 Bảng tra cứu các lệnh Scripts tại thư mục gốc](#32-bảng-tra-cứu-các-lệnh-scripts-tại-thư-mục-gốc)
   - [3.3 Bộ lệnh Verification Guardrails cho Lập trình viên & AI Tools](#33-bộ-lệnh-verification-guardrails-cho-lập-trình-viên--ai-tools)
4. [Trọng tâm: Quy trình Phát triển Backend → Frontend đảm bảo Type Safety](#4-trọng-tâm-quy-trình-phát-triển-backend--frontend-đảm-bảo-type-safety)
   - [4.1 Tổng quan chuỗi suy luận kiểu (Type Inference Chain)](#41-tổng-quan-chuỗi-suy-luận-kiểu-type-inference-chain)
   - [4.2 Chi tiết 8 bước phát triển tính năng (Lấy module `Role` làm ví dụ mẫu)](#42-chi-tiết-8-bước-phát-triển-tính-năng-lấy-module-role-làm-ví-dụ-mẫu)
   - [4.3 Cấu hình OpenAPI Tag Groups & Tags (`openapi-config.ts`)](#43-cấu-hình-openapi-tag-groups--tags-openapi-configts)
   - [4.4 Quy ước vàng (Golden Rules) giữ vững Kiến trúc & Type Safety](#44-quy-ước-vàng-golden-rules-giữ-vững-kiến-trúc--type-safety)
5. [Cơ chế Xác thực (Auth) & Phân quyền Động (RBAC)](#5-cơ-chế-xác-thực-auth--phân-quyền-động-rbac)
   - [5.1 Các cấp độ xác thực Route (`authType`)](#51-các-cấp-độ-xác-thực-route-authtype)
   - [5.2 Cơ chế sinh mã băm API Route & Macro `isAuth`](#52-cơ-chế-sinh-mã-băm-api-route--macro-isauth)
   - [5.3 Xác thực đăng nhập qua `/api/auth` & Phân quyền Menu động tại Frontend](#53-xác-thực-đăng-nhập-qua-apiauth--phân-quyền-menu-động-tại-frontend)
6. [Hiện trạng Mã nguồn & Lưu ý Kỹ thuật](#6-hiện-trạng-mã-nguồn--lưu-ý-kỹ-thuật)
7. [Checklist thêm một Module mới](#7-checklist-thêm-một-module-mới)

---

## 1. Kiến trúc & Bản đồ Source Code

### 1.1 Cấu trúc Monorepo tổng quan

Repo được tổ chức theo mô hình **Bun Workspaces** với cấu hình dependency tập trung tại `package.json` root (`workspaces.catalog`).

```text
.
├── apps/
│   ├── backend/                     # Backend API Server (ElysiaJS + Drizzle)
│   │   ├── migrations/              # SQL migrations sinh ra bởi Drizzle Kit
│   │   ├── scripts/
│   │   │   └── check-architecture.ts # Guardrail kiểm tra vi phạm kiến trúc tĩnh
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema/          # Drizzle ORM Table schemas (PostgreSQL)
│   │   │   │   │   ├── menu-schema.ts
│   │   │   │   │   ├── role-schema.ts
│   │   │   │   │   ├── user-schema.ts
│   │   │   │   │   └── schema-utils.ts
│   │   │   │   ├── columns-helpers.ts # Common timestamps, helpers
│   │   │   │   └── index.ts         # Khởi tạo node-postgres Pool & Drizzle DB
│   │   │   ├── modules/             # Modular Screaming Architecture (Autoloaded)
│   │   │   │   ├── auth/            # Module Xác thực (Login, JWT, Password)
│   │   │   │   │   ├── auth.schema.ts      # TypeBox validation schemas & DTOs
│   │   │   │   │   ├── auth.repository.ts  # Data Access Layer (DB queries)
│   │   │   │   │   ├── auth.service.ts     # Business logic (hash, login, token)
│   │   │   │   │   ├── auth.routes.ts      # HTTP Routes (Mapped tới /api/auth)
│   │   │   │   │   └── auth.service.test.ts# Unit tests cho Service (mock repo)
│   │   │   │   ├── user/            # Module Quản lý Người dùng
│   │   │   │   │   ├── user.schema.ts
│   │   │   │   │   ├── user.repository.ts
│   │   │   │   │   ├── user.service.ts
│   │   │   │   │   ├── user.routes.ts      # Mapped tới /api/user
│   │   │   │   │   └── user.service.test.ts
│   │   │   │   ├── role/            # Module Quản lý Vai trò & Phân quyền
│   │   │   │   │   ├── role.schema.ts
│   │   │   │   │   ├── role.repository.ts
│   │   │   │   │   ├── role.service.ts
│   │   │   │   │   └── role.routes.ts      # Mapped tới /api/role
│   │   │   │   ├── menu/            # Module Quản lý Menu & Điều hướng
│   │   │   │   │   ├── menu.schema.ts
│   │   │   │   │   ├── menu.repository.ts
│   │   │   │   │   ├── menu.service.ts
│   │   │   │   │   └── menu.routes.ts      # Mapped tới /api/menu
│   │   │   │   └── org/             # Module Quản lý Tổ chức / Chi nhánh
│   │   │   │       ├── org.schema.ts
│   │   │   │       ├── org.repository.ts
│   │   │   │       ├── org.service.ts
│   │   │   │       └── org.routes.ts       # Mapped tới /api/org
│   │   │   ├── shared/              # Shared utilities, errors & helpers
│   │   │   │   ├── errors/
│   │   │   │   │   └── app-error.ts # Lớp AppError chuẩn hóa mã lỗi HTTP
│   │   │   │   └── utils/
│   │   │   │       └── crypto.ts    # Tiện ích băm mật khẩu (HMAC-SHA256, Salt)
│   │   │   ├── addActivatedRolePlugin.ts # Nạp quyền RBAC từ DB vào bộ nhớ
│   │   │   ├── openapi-config.ts    # Cấu hình OpenAPI Tags / Groups
│   │   │   ├── routes-types.ts      # [AUTO-GENERATED] Hợp nhất toàn bộ route types cho Eden
│   │   │   ├── initDB.ts            # Script khởi tạo dữ liệu mẫu (Seed DB)
│   │   │   ├── env.ts               # Khai báo kiểu biến môi trường
│   │   │   ├── App.ts               # Khởi tạo Elysia app, middlewares & autoload modules
│   │   │   └── index.ts             # Server entry point (app.listen)
│   │   ├── drizzle.config.ts        # Cấu hình Drizzle Kit CLI
│   │   └── package.json
│   │
│   └── frontend/                    # Single Page Application (React 18 + Vite)
│       ├── src/
│       │   ├── async-store/         # Tầng giao tiếp API & TanStack Query Hooks
│       │   │   ├── apiClient.ts     # Khởi tạo Eden Treaty client (treaty<Routes>) & unwrap()
│       │   │   ├── query-keys.ts    # Quản lý Query Key tập trung
│       │   │   ├── menu.ts          # Hook useMenusQuery, useCreateMenu, useDeleteMenu
│       │   │   ├── role.ts          # Hook useRolesQuery, useRoleMutation, useApiList
│       │   │   ├── user.ts          # Hook useLogin, useUsersQuery, useUserMutation
│       │   │   └── org.ts           # Hook useOrgQuery
│       │   ├── pages/               # UI components theo tính năng
│       │   │   ├── management/
│       │   │   │   ├── system/role/ # Quản lý Role (Table, Modal, Form Antd v5)
│       │   │   │   ├── system/menu/ # Quản lý Menu & phân cấp
│       │   │   │   └── system/user/ # Quản lý User & gán quyền
│       │   │   └── sys/login/       # Đăng nhập & xác thực
│       │   ├── router/              # React Router v7 & Dynamic Permission Routes
│       │   ├── store/               # Zustand state (userStore, token, locale, settings)
│       │   ├── theme/               # Antd Theme token & adapter
│       │   └── main.tsx             # Entry point React & QueryClientProvider
│       └── vite.config.ts
│
├── packages/
│   ├── elysia-autoload/             # Core plugin: tự động mount routes và sinh `routes-types.ts`
│   ├── type-utils/                  # Tiện ích trích xuất type cho Eden Treaty (`InferReqBodyType`, ...)
│   └── openapi-scalar/              # Tích hợp giao diện tài liệu Scalar API
│
├── scripts/
│   └── generate-routes-types.ts     # Script chủ động sinh `routes-types.ts` độc lập từ modules
│
├── tsconfig.base.json               # Path alias: @be/*, @fe/*, #fe/*
├── package.json                     # Root scripts & Bun workspace catalog
└── biome.json                       # Cấu hình Biome Linter / Formatter
```

---

### 1.2 Kiến trúc Phân tầng 4 lớp trong Backend (`src/modules/`)

Mỗi domain chức năng trong [apps/backend/src/modules/](apps/backend/src/modules/) được cấu trúc chặt chẽ theo 4 lớp phân tách rõ ràng trách nhiệm (**Separation of Concerns**), được tối ưu hóa đặc biệt cho cả lập trình viên và **AI Coding Agents** (Claude Code, Cursor, OpenCode):

```text
               HTTP Request từ Client
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 1. Presentation Layer (*.routes.ts)                   │
│    - Khai báo endpoint HTTP, params, query, body       │
│    - Gắn schema validation (TypeBox)                   │
│    - Gọi Service tương ứng, map HTTP status & response │
│    - KHÔNG ĐƯỢC CHỨA SQL / GỌI DB TRỰC TIẾP!           │
└────────────────────────┬───────────────────────────────┘
                         │ Plain DTOs & Params
                         ▼
┌────────────────────────────────────────────────────────┐
│ 2. Business Logic Layer (*.service.ts)                 │
│    - Chứa 100% Pure Business Logic                     │
│    - Độc lập hoàn toàn với Elysia/HTTP context         │
│    - Ném lỗi chuẩn hóa qua AppError                    │
│    - Nhận Repository qua Dependency Injection (dễ test)│
└────────────────────────┬───────────────────────────────┘
                         │ Domain Data Call
                         ▼
┌────────────────────────────────────────────────────────┐
│ 3. Data Access Layer (*.repository.ts)                │
│    - Đóng gói toàn bộ câu lệnh Drizzle ORM / SQL       │
│    - Expose các hàm dữ liệu: findById, create, update  │
│    - Che giấu hoàn toàn chi tiết DB khỏi tầng Service  │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ 4. Contract & Model Layer (*.schema.ts)                │
│    - Chứa DTO TypeBox cho Insert, Select, Query params │
│    - Tạo từ Drizzle tables qua drizzle-typebox         │
│    - Định nghĩa các kiểu dữ liệu dùng chung (Types)    │
└────────────────────────────────────────────────────────┘
```

#### Lợi ích vượt trội cho AI Coding Agents:
1. **Tiết kiệm Token & Ngữ cảnh (Context Window)**: Khi cần thêm tính năng hay sửa logic, AI chỉ cần nạp đúng 1-2 file nhỏ (30 - 80 dòng) của module thay vì phải đọc toàn bộ file route ôm trùm DB lớn hàng trăm dòng.
2. **Sinh code tất định (Deterministic Code Generation)**: Pattern đồng nhất `schema → repo → service → routes` giúp AI sinh code chuẩn mực, không tự sáng tác phong cách mới.
3. **Dễ viết Unit Test**: Tầng `service` hoàn toàn thuần túy, có thể viết test mock repository siêu tốc mà không cần khởi động database PostgreSQL.
4. **Bảo vệ bằng Linter Kiến trúc (Architecture Guardrails)**: Script [check-architecture.ts](apps/backend/scripts/check-architecture.ts) sẽ chặn đứng ngay lập tức nếu AI vi phạm quy tắc (như import DB trực tiếp trong route).

---

### 1.3 Path Aliases quan trọng (`tsconfig.base.json`)
- `@be/*` → `./apps/backend/src/*` (Được dùng trong backend và type-import ở frontend)
- `@fe/*` → `./apps/frontend/src/*`
- `#fe/*` → `./apps/frontend/types/*`

---

## 2. Cấu hình Môi trường (Environment Variables)

### 2.1 Nguyên tắc cấu hình & vị trí file
- **Không bao giờ commit file `.env` chứa thông tin nhạy cảm vào Git.** Sử dụng `.env.local` hoặc `.env.development.local` cho các giá trị tùy biến trên máy lập trình viên.
- **Backend:** Cần nạp cấu hình cơ sở dữ liệu cho cả **Runtime client** ([apps/backend/src/db/index.ts](apps/backend/src/db/index.ts)) và **CLI migration tool** ([apps/backend/drizzle.config.ts](apps/backend/drizzle.config.ts)).
- **Frontend:** Các biến muốn dùng ở trình duyệt **bắt buộc phải có tiền tố `VITE_`**. Mọi biến này sẽ được Vite inline trực tiếp vào mã nguồn client khi build, **tuyệt đối không đặt mật khẩu, API private key hay JWT Secret vào frontend env**.

---

### 2.2 Cấu hình Backend (`apps/backend`)

Tạo file `apps/backend/.env` (tham khảo `apps/backend/.env.example`):

```bash
cp apps/backend/.env.example apps/backend/.env
```

#### Bảng thông số Backend:

| Biến | Bắt buộc | Mặc định | Mục đích & Nơi sử dụng |
| :--- | :---: | :---: | :--- |
| `PORT` | Có | `3000` | Cổng HTTP server của Elysia ([apps/backend/src/index.ts](apps/backend/src/index.ts)). |
| `DB_HOST` | Có | `localhost` | Địa chỉ PostgreSQL host (dùng cho `drizzle.config.ts`). |
| `DB_PORT` | Có | `5432` | Cổng PostgreSQL (dùng cho `drizzle.config.ts`). Nếu dùng Docker compose đi kèm, đổi thành `5433`. |
| `DB_NAME` | Có | `todo` | Tên Database PostgreSQL (dùng cho `drizzle.config.ts`). |
| `DB_USER` | Có | `postgres` | Tài khoản PostgreSQL (dùng cho `drizzle.config.ts`). |
| `DB_PASSWORD` | Có | `admin@123` | Mật khẩu PostgreSQL (dùng cho `drizzle.config.ts`). |
| `DB_URL` | Có | Xem ghi chú | **Connection string trực tiếp cho Runtime DB client** ([apps/backend/src/db/index.ts](apps/backend/src/db/index.ts)). |
| `JWT_SECRET` | Có | - | Chuỗi bí mật ký Token JWT ([apps/backend/src/App.ts](apps/backend/src/App.ts)). Tối thiểu 32 ký tự. |
| `nonExportedType`| Tùy chọn | *unset* | Khi có giá trị (truthy), plugin autoload sẽ **tắt** sinh file `routes-types.ts` (dùng khi build bundle production). **Khi dev phải để trống.** |
| `initDB` | Tùy chọn | `false` | Cờ khai báo trong schema env. |

> **⚠️ LƯU Ý VỀ DB_URL VÀ DRIZZLE:**
> - `drizzle-kit` (`db:generate`, `db:migrate`, `db:push`) sử dụng các biến rời: `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`.
> - Ứng dụng Backend lúc chạy ([src/db/index.ts](apps/backend/src/db/index.ts)) sử dụng trực tiếp chuỗi `DB_URL`.
> - **Cả hai phải trỏ về cùng một database!** Nếu mật khẩu có ký tự đặc biệt (như `@`, `#`, `!`), chuỗi `DB_URL` phải được URL-encoded (ví dụ: `admin%40123`), trong khi `DB_PASSWORD` giữ nguyên dạng thô.

#### Mẫu 1: Dùng PostgreSQL cài sẵn trên máy (Cổng mặc định 5432)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todo
DB_USER=postgres
DB_PASSWORD=admin@123
DB_URL=postgres://postgres:admin%40123@localhost:5432/todo
JWT_SECRET=super_secret_jwt_key_for_development_environment_32chars
```

#### Mẫu 2: Dùng Docker Compose đi kèm (`apps/backend/docker-compose.yaml` - Cổng host 5433)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=todo
DB_USER=postgres
DB_PASSWORD=123
DB_URL=postgres://postgres:123@localhost:5433/todo
JWT_SECRET=super_secret_jwt_key_for_development_environment_32chars
```

---

### 2.3 Cấu hình Frontend (`apps/frontend`)

Frontend hỗ trợ nạp cấu hình theo môi trường qua các file:
- `apps/frontend/.env` (nạp ở mọi chế độ)
- `apps/frontend/.env.development` (chế độ development)
- `apps/frontend/.env.production` (chế độ build production)

#### Bảng thông số Frontend:

| Biến | Bắt buộc | Giá trị mẫu | Mục đích & Nơi sử dụng |
| :--- | :---: | :---: | :--- |
| `VITE_APP_BACKEND_HOST` | Có | `http://localhost:3000` | **Origin của Backend Server**, nơi Eden Treaty ([apps/frontend/src/async-store/apiClient.ts](apps/frontend/src/async-store/apiClient.ts)) kết nối tới. **Không kèm hậu tố `/api`**. |
| `VITE_APP_HOMEPAGE` | Có | `/dashboard/workbench` | Đường dẫn trang chủ mặc định sau khi đăng nhập thành công. |
| `VITE_APP_ROUTER_MODE` | Có | `permission` | `permission`: Phân quyền động theo Menu từ Backend trả về; `module`: Nạp toàn bộ route tĩnh từ client. |
| `VITE_APP_BASE_PATH` | Có | `/` | Base URL routing của Vite asset. |
| `VITE_APP_BASE_API` | Tùy chọn | `/api` | Tiền tố API cho các client axios/fetch thông thường (nếu có). |
| `VITE_APP_ENV` | Tùy chọn | `development` | Tên nhãn môi trường hiển thị. |

#### File cấu hình mẫu cho Local Dev (`apps/frontend/.env.development`):
```env
VITE_APP_BACKEND_HOST=http://localhost:3000
VITE_APP_HOMEPAGE=/dashboard/workbench
VITE_APP_ROUTER_MODE=permission
VITE_APP_BASE_PATH=/
VITE_APP_BASE_API=/api
VITE_APP_ENV=development
```

---

### 2.4 Bảng chẩn đoán lỗi môi trường thường gặp

| Hiện tượng | Nguyên nhân gốc rễ | Cách xử lý |
| :--- | :--- | :--- |
| **`Connection refused at localhost:5432`** | PostgreSQL chưa bật hoặc cổng cấu hình sai giữa 5432 và 5433 (Docker). | Kiểm tra `docker ps` hoặc trạng thái PostgreSQL service; đối chiếu `DB_PORT` và `DB_URL`. |
| **`database "todo" does not exist`** | Container Postgres mới dựng chưa được tạo sẵn Database `todo`. | Đăng nhập Postgres tạo database: `CREATE DATABASE todo;`. |
| **`drizzle-kit migrate` thành công nhưng API báo `relation does not exist`** | `drizzle.config.ts` (dùng `DB_*`) và runtime (`DB_URL`) đang trỏ tới 2 database/cổng khác nhau. | Đồng bộ hóa thông số giữa các biến rời và chuỗi `DB_URL`. |
| **API gọi bị 404 (ví dụ: `http://localhost:3000/api/api/role`)** | Cấu hình `VITE_APP_BACKEND_HOST` có gắn dư `/api`. | Bỏ `/api` ở cuối `VITE_APP_BACKEND_HOST`, chỉ để `http://localhost:3000`. |
| **Thay đổi `.env` nhưng trình duyệt không nhận** | Vite chỉ nhúng biến `VITE_*` vào bundle lúc khởi động. | Tắt dev server (`Ctrl+C`) và chạy lại `bun run dev:frontend`. |
| **Không sinh ra file `apps/backend/src/routes-types.ts`** | Biến `nonExportedType` bị gán giá trị (kể cả `"false"` cũng là truthy trong JS). | Xóa bỏ hoặc unset biến `nonExportedType` trong `.env`. |

---

## 3. Hướng dẫn Khởi chạy & Các lệnh thường dùng

### 3.1 Các bước khởi chạy dự án từ đầu (First Run):

#### Bước 1: Cài đặt Dependencies toàn bộ monorepo
Tại thư mục gốc dự án:
```bash
bun install
```

#### Bước 2: Chuẩn bị Cơ sở dữ liệu
Nếu chưa có PostgreSQL cục bộ, bạn có thể chạy container đính kèm:
```bash
docker compose -f apps/backend/docker-compose.yaml up -d
# Tạo database nếu chưa có:
docker exec -it tododb_container psql -U postgres -c "CREATE DATABASE todo;"
```

#### Bước 3: Cấu hình file `.env`
Thiết lập file `.env` cho cả `apps/backend/.env` và `apps/frontend/.env.development` như hướng dẫn ở Mục 2.

#### Bước 4: Chạy Migration & Khởi tạo Dữ liệu mẫu (Seed Data)
```bash
# 1. Chạy migration các bảng (menus, roles, users) vào Database
bun run db:migrate

# 2. Tạo Root Admin User, Menus và Role mặc định (chạy từ root)
bun run db:init
```
> **Thông tin tài khoản mặc định sau khi seed:**
> - Email: `admin@gmail.com`
> - Mật khẩu: `admin@123`
> *(Lưu ý: `initDB.ts` không idempotent, chỉ chạy 1 lần khi DB còn trống).*

#### Bước 5: Khởi động Development Servers
```bash
# Chạy đồng thời cả Backend và Frontend
bun run dev
```
- **Backend API:** `http://localhost:3000`
- **Scalar OpenAPI Documentation:** `http://localhost:3000/openapi` (Xem chi tiết API tương tác trực tiếp)
- **Frontend App:** `http://localhost:3002`

---

### 3.2 Bảng tra cứu các lệnh Scripts tại thư mục gốc

| Lệnh | Ý nghĩa | Phạm vi |
| :--- | :--- | :--- |
| `bun run dev` | Chạy dev song song cả Backend (port 3000) và Frontend (port 3002). | Toàn bộ monorepo |
| `bun run dev:backend` | Chỉ chạy Backend với hot-reload (`bun run --watch src/index.ts`). | `apps/backend` |
| `bun run dev:frontend` | Chỉ chạy Frontend Vite server (`bunx --bun vite`). | `apps/frontend` |
| `bun run typecheck` | Kiểm tra lỗi TypeScript nghiêm ngặt trên toàn bộ workspaces (`tsc --noEmit`). | Toàn bộ 5 workspace |
| `bun run typecheckbe` | Kiểm tra lỗi TypeScript riêng cho Backend (`tsc --noEmit`). | `apps/backend` |
| `bun run typecheckfe` | Kiểm tra lỗi TypeScript riêng cho Frontend (`tsc --noEmit`). | `apps/frontend` |
| `bun run lint` | Chạy Biome linter / formatter check trên toàn bộ monorepo. | Toàn bộ monorepo |
| `bun run lint:fix` | Tự động sửa lỗi format và lint bằng Biome trên toàn bộ monorepo. | Toàn bộ monorepo |
| `bun run lintbe` | Chạy Biome check riêng cho Backend. | `apps/backend` |
| `bun run lintfe` | Chạy Biome check riêng cho Frontend. | `apps/frontend` |
| `bun run db:generate` | Tạo file SQL migration mới trong `migrations/` từ schema thay đổi. | `apps/backend` |
| `bun run db:migrate` | Áp dụng các file migration chưa chạy vào Database. | `apps/backend` |
| `bun run db:push` | Đẩy trực tiếp schema lên DB (chỉ dùng cho prototyping/local nhanh). | `apps/backend` |
| `bun run routes:generate` | Quét thư mục `modules/` và sinh lại file contract `routes-types.ts` độc lập. | `apps/backend` (từ root) |
| `bun run routes:types` | Alias ngắn gọn của `routes:generate`. | `apps/backend` (từ root) |
| `bun run routes:watch` | Tự động theo dõi `modules/` và cập nhật `routes-types.ts` ngay khi file thay đổi. | `apps/backend` (từ root) |
| `bun run build` | Thực hiện build bundle cho các workspace hỗ trợ build. | Toàn bộ monorepo |

---

### 3.3 Bộ lệnh Verification Guardrails cho Lập trình viên & AI Tools

Nhằm đảm bảo chất lượng code và bảo vệ kiến trúc phân tầng, dự án cung cấp bộ lệnh kiểm thử và thẩm định:

```bash
# Chạy bộ thẩm định toàn diện Backend (Typecheck + Architecture Check + Unit Test)
bun --filter backend verify
# hoặc chạy trực tiếp trong thư mục apps/backend:
cd apps/backend && bun run verify

# Kiểm tra tĩnh vi phạm kiến trúc (bảo đảm Route không gọi trực tiếp Database)
bun --filter backend arch:check

# Chạy Unit Tests cho các Service logic
bun --filter backend test
```

---

## 4. Trọng tâm: Quy trình Phát triển Backend → Frontend đảm bảo Type Safety

Nguyên lý cốt lõi của template là **Single Source of Truth**: Kiểu dữ liệu bắt nguồn từ Database Schema, chuyển hóa thành DTO Schema trong từng Module, xử lý qua Service & Repository, tự động ánh xạ thành API Contract qua `elysia-autoload`, và được Frontend tiêu thụ thông qua Eden Treaty và TanStack Query. Bạn không bao giờ phải viết lại kiểu dữ liệu thủ công ở Frontend!

### 4.1 Tổng quan chuỗi suy luận kiểu (Type Inference Chain)

```text
[1. Drizzle ORM Schema] (apps/backend/src/db/schema/*)
       │
       ▼ (createSelectSchema, createInsertSchema từ drizzle-typebox)
[2. Module Schema & DTOs] (apps/backend/src/modules/<feature>/*.schema.ts)
       │
       ▼ (Data Access Queries)
[3. Data Access Repository] (apps/backend/src/modules/<feature>/*.repository.ts)
       │
       ▼ (Pure Business Logic & Errors)
[4. Business Logic Service] (apps/backend/src/modules/<feature>/*.service.ts)
       │
       ▼ (Elysia Route Handlers: body, params, response validation)
[5. Elysia Route Handlers] (apps/backend/src/modules/<feature>/*.routes.ts)
       │
       ▼ (Tự động quét và nạp bởi elysia-autoload khi dev)
[6. API Routes Types] (apps/backend/src/routes-types.ts)
       │
       ▼ (Eden Treaty: treaty<Routes>(BACKEND_HOST))
[7. Eden Treaty Client] (apps/frontend/src/async-store/apiClient.ts)
       │
       ▼ (type-utils: InferReqBodyType, InferResType & unwrap())
[8. TanStack Query Hooks] (apps/frontend/src/async-store/*)
       │
       ▼ (Data/Mutate được type đầy đủ)
[9. Ant Design UI Components] (Form<T>, Table ColumnsType<T>, Modals)
```

---

### 4.2 Chi tiết 8 bước phát triển tính năng (Lấy module `Role` làm ví dụ mẫu)

#### Bước 1: Khai báo Database Schema ([apps/backend/src/db/schema/role-schema.ts](apps/backend/src/db/schema/role-schema.ts))
Sử dụng Drizzle ORM để định nghĩa bảng cơ sở dữ liệu:
```typescript
import * as t from "drizzle-orm/pg-core";
import { timestamps } from "../columns-helpers";

export const roles = t.pgTable("roles", {
  id: t.smallserial().primaryKey(),
  name: t.varchar().notNull(),
  desc: t.varchar(),
  status: t.boolean().default(true),
  menus: t.smallint().array().default([]),
  hmenus: t.smallint().array().default([]),
  apis: t.bigint({ mode: "number" }).array().default([]),
  ...timestamps,
});
```
*Chạy `bun run db:generate` và `bun run db:migrate` để cập nhật cấu trúc database.*

---

#### Bước 2: Tạo TypeBox Validation Schema ([apps/backend/src/modules/role/role.schema.ts](apps/backend/src/modules/role/role.schema.ts))
Đặt schema ngay trong thư mục module để tăng tính tự đóng gói (cohesion):
```typescript
import { roles } from "@be/db/schema/role-schema";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

// Schema cho dữ liệu lấy từ DB
export const selectRoleSchema = createSelectSchema(roles);
export type Role = typeof selectRoleSchema.static;

// Schema cho dữ liệu tạo mới từ Client
export const insertRoleSchema = createInsertSchema(roles);
export type InsertRole = typeof insertRoleSchema.static;

export { roles };
```

---

#### Bước 3: Viết Data Access Layer - Repository ([apps/backend/src/modules/role/role.repository.ts](apps/backend/src/modules/role/role.repository.ts))
Toàn bộ thao tác truy vấn Drizzle ORM được cô lập tại đây:
```typescript
import { db } from "@be/db";
import { and, eq, inArray } from "drizzle-orm";
import { type InsertRole, roles } from "./role.schema";

export const roleRepository = {
  async findAll() {
    return db.select().from(roles);
  },

  async findByIds(roleIds: number[]) {
    if (!roleIds.length) return [];
    return db
      .select()
      .from(roles)
      .where(and(inArray(roles.id, roleIds), eq(roles.status, true)));
  },

  async create(data: InsertRole) {
    return db.insert(roles).values(data).returning({ id: roles.id });
  },

  async update(id: number, data: Record<string, any>) {
    return db.update(roles).set(data).where(eq(roles.id, id));
  },
};

export type RoleRepository = typeof roleRepository;
```

---

#### Bước 4: Viết Pure Business Logic Service & Unit Test ([apps/backend/src/modules/role/role.service.ts](apps/backend/src/modules/role/role.service.ts))
Xử lý logic nghiệp vụ thuần túy, độc lập với framework HTTP và nhận repository qua tham số mặc định (Dependency Injection):
```typescript
import { type RoleRepository, roleRepository } from "./role.repository";
import type { InsertRole } from "./role.schema";

export function createRoleService(roleRepo: RoleRepository = roleRepository) {
  return {
    async listRoles() {
      return roleRepo.findAll();
    },

    async createRole(data: InsertRole) {
      return roleRepo.create(data);
    },

    async updateRole(data: { id: number; [key: string]: any }) {
      const { id, ...updateData } = data;
      const result = await roleRepo.update(id, updateData);
      return { status: 0, data: result };
    },
  };
}

export const roleService = createRoleService();
export type RoleService = ReturnType<typeof createRoleService>;
```
*Nhờ cấu trúc này, bạn có thể viết unit test siêu nhanh bằng cách truyền mock repository vào `createRoleService(mockRepo)` (tham khảo mẫu tại [apps/backend/src/modules/auth/auth.service.test.ts](apps/backend/src/modules/auth/auth.service.test.ts)).*

---

#### Bước 5: Viết Elysia Route Handler ([apps/backend/src/modules/role/role.routes.ts](apps/backend/src/modules/role/role.routes.ts))
Tầng route chỉ chịu trách nhiệm nhận HTTP request, validate schema và gọi Service. **Tuyệt đối không query DB trực tiếp tại đây!**

```typescript
import { withNumericId } from "@be/db/schema/schema-utils";
import { t } from "elysia";
import type { App } from "../../App";
import { insertRoleSchema, selectRoleSchema } from "./role.schema";
import { roleService } from "./role.service";

export default (app: App) =>
  app
    .post(
      "",
      async ({ body }) => {
        return roleService.createRole(body);
      },
      {
        body: insertRoleSchema,
        detail: {
          summary: "Create a new role",
          tags: ["Role"],
          authType: 2, // 2: Cần quyền RBAC
        },
      },
    )
    .put(
      "",
      async ({ body }) => {
        return roleService.updateRole(body);
      },
      {
        body: withNumericId(insertRoleSchema),
        detail: {
          summary: "Update role",
          tags: ["Role"],
          authType: 2,
        },
      },
    )
    .get(
      "",
      async () => {
        return roleService.listRoles();
      },
      {
        response: t.Array(selectRoleSchema),
        detail: {
          summary: "Return role list",
          tags: ["Role"],
          authType: 0,
        },
      },
    );
```

---

#### Bước 6: Cập nhật API Contract ([apps/backend/src/routes-types.ts](apps/backend/src/routes-types.ts))
File [routes-types.ts](apps/backend/src/routes-types.ts) hợp nhất toàn bộ types của routes để Frontend tiêu thụ qua Eden Treaty:
- **Tự động khi dev server chạy:** Plugin `elysia-autoload` tự quét thư mục `modules/` theo pattern `**/*.routes.ts` và cập nhật file.
- **Chủ động sinh type độc lập:** Chạy lệnh `bun run routes:generate` (hoặc `bun run routes:watch`) từ thư mục gốc.

```typescript
// File này ĐƯỢC TỰ ĐỘNG SINH, không sửa bằng tay!
import type { ElysiaWithBaseUrl } from "elysia-autoload";
import type { App } from "./App";
import type Route1 from "./modules/role/role.routes";

export type Routes = App 
  & ElysiaWithBaseUrl<"/api/role", typeof Route1>;
```

---

#### Bước 7: Cấu hình Eden Treaty Client & TanStack Query Hooks ([apps/frontend/src/async-store/role.ts](apps/frontend/src/async-store/role.ts))
Frontend trích xuất kiểu dữ liệu trực tiếp từ Eden Treaty client:

```typescript
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferReqBodyType, InferResType } from "packages/type-utils";
import { treatyClient, unwrap } from "./apiClient";

// 1. Trích xuất kiểu danh sách Role trả về từ API
export type RoleList = InferResType<typeof treatyClient.api.role.get>;

// 2. Trích xuất kiểu Request Body cho API tạo mới & cập nhật
export type CreateRoleType = NonNullable<InferReqBodyType<typeof treatyClient.api.role.post>>;

// Query Hook: Lấy danh sách Roles
export const useRolesQuery = () => {
  return useQuery<RoleList, unknown>({
    queryKey: ["roles"],
    queryFn: async () => unwrap(treatyClient.api.role.get()),
  });
};

// Mutation Hook: Tạo hoặc Cập nhật Role
export const useRoleMutation = () => {
  return useMutation({
    mutationFn: async (role: CreateRoleType) => {
      if (role?.id) {
        return treatyClient.api.role.put(role as InferReqBodyType<typeof treatyClient.api.role.put>);
      }
      return treatyClient.api.role.post(role);
    },
  });
};
```

---

#### Bước 8: Sử dụng an toàn kiểu trong Ant Design UI ([apps/frontend/src/pages/management/system/role/index.tsx](apps/frontend/src/pages/management/system/role/index.tsx))

```tsx
import { type CreateRoleType, useRolesQuery } from "@fe/async-store/role";
import { Card, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

export default function RolePage() {
  const { data: roles, isLoading } = useRolesQuery();

  const columns: ColumnsType<CreateRoleType> = [
    {
      title: "Tên vai trò",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status ? "success" : "error"}>
          {status ? "Hoạt động" : "Khóa"}
        </Tag>
      ),
    },
  ];

  return (
    <Card title="Danh sách Vai trò">
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={roles}
      />
    </Card>
  );
}
```

---

### 4.3 Cấu hình OpenAPI Tag Groups & Tags ([openapi-config.ts](apps/backend/src/openapi-config.ts))

File [openapi-config.ts](apps/backend/src/openapi-config.ts) đóng vai trò là **Single Source of Truth** để quản lý cấu trúc nhóm thẻ (`x-tagGroups`) và danh sách các thẻ (`tags`) trong hệ thống API. Cấu hình này phục vụ đồng thời cho 3 mục đích:
1. **Phân nhóm tài liệu API trên Scalar OpenAPI UI** (`/openapi`): Hiển thị sidebar tài liệu theo từng nhóm chức năng rõ ràng, gọn gàng.
2. **Type-safe & Autocomplete cho Router**: Ràng buộc kiểu dữ liệu `TagType` cho thuộc tính `detail.tags` trong các route handlers, giúp Editor tự động gợi ý tag khi khai báo router.
3. **Đồng bộ cây phân quyền RBAC**: Cung cấp cấu trúc danh mục cho endpoint `GET /__apis__` để giao diện quản lý phân quyền (Frontend) hiển thị cây API theo nhóm.

#### 1. Cấu trúc cấu hình `xtagGroups`
Biến `xtagGroups` được khai báo dạng `as const satisfies XtagGroup[]`:

```typescript
interface XtagGroup {
  name: string;
  tags?: string[];
}

export const xtagGroups = [
  {
    name: "System",
    tags: ["Menu", "Role"],
  },
  // Tất cả các tags không thuộc vào một nhóm cụ thể nào đặt trong nhóm @----@ này
  {
    name: "@----@",
    tags: ["User", "Other", "Organization"],
  },
] as const satisfies XtagGroup[];
```

#### 2. Quy tắc khai báo Tag và Tag Group
- **Thêm 1 Tag Group mới:** Khi muốn tạo một nhóm chức năng mới, thêm một object mới vào mảng `xtagGroups` với `name` là tên group và `tags` là danh sách các tag thuộc nhóm:
  ```typescript
  {
    name: "Catalog",
    tags: ["Product", "Category"],
  },
  ```
- **Tất cả các Tag bắt buộc phải thuộc về một Tag Group:** Mọi tag được sử dụng trong hệ thống đều phải nằm trong mảng `xtagGroups`.
- **Nhóm đặc biệt `@----@` (Ungrouped / Generic Tags):**
  - Trong trường hợp một tag **không thuộc vào bất kỳ nhóm cụ thể nào**, bắt buộc phải đưa tag đó vào nhóm có `name` là `"@----@"`.
  - **Cơ chế hoạt động:** Scalar API Reference hiển thị tài liệu theo cây nhóm `x-tagGroups`. Đối với nhóm có tên `"@----@"`, script tùy biến tại [scalar-render.ts](packages/openapi-scalar/src/scalar-render.ts) sẽ tự động nhận diện, ẩn tiêu đề `"@----@"` và hiển thị các tag con của nhóm này trực tiếp ở cấp cao nhất trên sidebar (dạng top-level unindent), giúp giao diện tài liệu tự nhiên và không xuất hiện nhóm thừa.

#### 3. Cơ chế Editor tự động gợi ý Tag khi khai báo Router
Hệ thống sử dụng cơ chế trích xuất kiểu tự động (Type Inference) kết hợp TypeScript Module Augmentation:

1. **Trích xuất `TagType` từ `xtagGroups`:**
   Tại [openapi-config.ts](apps/backend/src/openapi-config.ts), utility type `ExtractTags` sẽ trích xuất danh sách tất cả các tag chuỗi literal từ `xtagGroups`:
   ```typescript
   type ExtractTags<T> = T extends readonly (infer Group)[]
     ? Group extends { tags: readonly (infer TTag extends string)[] }
       ? TTag
       : Group extends { name: infer TName extends string }
         ? TName
         : never
     : never;

   export type TagType = ExtractTags<typeof xtagGroups>;
   // TagType tương đương: "Menu" | "Role" | "User" | "Other" | "Organization" | ...
   ```

2. **Mở rộng kiểu của Elysia (`DocumentDecoration`):**
   Tại [App.ts](apps/backend/src/App.ts), interface `DocumentDecoration` của Elysia được mở rộng:
   ```typescript
   declare module "elysia" {
     interface DocumentDecoration {
       tags?: TagType[];
       authType?: 0 | 1 | 2;
     }
   }
   ```

3. **Trải nghiệm lập trình trong Router ([src/modules/](apps/backend/src/modules/)):**
   Khi khai báo route, thuộc tính `detail.tags` sẽ nhận kiểu `TagType[]`. Nhờ đó:
   - **Editor (VS Code, Cursor,...) tự động gợi ý (IntelliSense/Autocomplete):** Khi bạn gõ `tags: [""]`, danh sách tất cả các tag hợp lệ khai báo trong `xtagGroups` sẽ lập tức hiện ra để lựa chọn.
   - **Bắt lỗi tại compile-time:** Nếu gõ sai chính tả hoặc dùng một tag chưa được định nghĩa trong `xtagGroups`, TypeScript sẽ báo lỗi ngay lập tức, ngăn ngừa lỗi typo trước khi code được chạy.

```typescript
export default (app: App) =>
  app.get(
    "",
    async () => { /* ... */ },
    {
      detail: {
        summary: "Lấy danh sách người dùng",
        tags: ["User"], // <-- Editor tự động gợi ý các tag từ xtagGroups, báo lỗi nếu nhập sai!
        authType: 0,
      },
    },
  );
```

#### 4. Cơ chế kiểm tra trùng lặp tại Runtime (`extractAndValidateTags`)
Tại [openapi-config.ts](apps/backend/src/openapi-config.ts), hàm `extractAndValidateTags(xtagGroups)` tự động chạy khi khởi động server để bảo vệ tính toàn vẹn dữ liệu:
- Kiểm tra không trùng lặp tên group giữa các nhóm.
- Kiểm tra không trùng lặp tên tag giữa các nhóm.
- Kiểm tra tên group không được trùng với bất kỳ tên tag nào đã tồn tại.

Nếu phát hiện vi phạm, hệ thống sẽ ném ngoại lệ (`Error`) ngay lập tức để lập trình viên phát hiện và khắc phục trước khi chạy thực tế.

---

### 4.4 Quy ước vàng (Golden Rules) giữ vững Kiến trúc & Type Safety

1. **Ranh giới phân tầng nghiêm ngặt (Strict Layer Boundaries):**
   - File `*.routes.ts` **tuyệt đối không** được `import { db } from "@be/db"` hay gọi `drizzle-orm`. Mọi thao tác truy vấn cơ sở dữ liệu phải nằm trong `*.repository.ts`.
   - Script [apps/backend/scripts/check-architecture.ts](apps/backend/scripts/check-architecture.ts) sẽ tự động kiểm tra tĩnh và từ chối nếu có bất kỳ vi phạm nào.
2. **Xử lý lỗi tập trung qua `AppError`:**
   - Trong `*.service.ts`, luôn ném lỗi bằng lớp chuẩn hóa [apps/backend/src/shared/errors/app-error.ts](apps/backend/src/shared/errors/app-error.ts) (ví dụ: `throw AppError.unauthorized("Sai mật khẩu")`, `throw AppError.notFound("Không tìm thấy người dùng")`).
3. **Pure Services với Dependency Injection:**
   - Luôn xuất hàm factory `createXService(repo = defaultRepo)` trong `*.service.ts` để có thể inject mock repository khi viết unit test mà không cần kết nối tới PostgreSQL.
4. **Không bao giờ viết lại Interface DTO bằng tay ở Frontend:**
   - Luôn dùng `InferReqBodyType<typeof treatyClient...>` và `InferResType<typeof treatyClient...>`. Khi backend sửa trường, TypeScript frontend sẽ báo đỏ ngay lập tức tại vị trí sử dụng.
5. **Luôn bọc lời gọi Treaty qua hàm `unwrap()`:**
   - Mặc định Eden Treaty trả về `{ data, error }`. Nếu không bọc qua `unwrap()`, TanStack Query sẽ coi request lỗi là thành công và trả `undefined` vào `data`.
6. **Luôn khai báo `response` schema trong route Elysia khi cần trả về mảng hoặc object có cấu trúc đặc biệt:**
   - Giúp TypeBox và Eden Treaty suy luận chính xác kiểu dữ liệu thay vì rơi về kiểu `unknown` hoặc generic Object.
7. **Không ép kiểu bừa bãi (`as any`, `@ts-ignore`):**
   - Nếu một trường bị lỗi type, hãy kiểm tra lại schema tại Backend (`modules/<domain>/<domain>.schema.ts`) hoặc chạy lại `bun run routes:generate` để cập nhật `routes-types.ts`.

---

## 5. Cơ chế Xác thực (Auth) & Phân quyền Động (RBAC)

Hệ thống được thiết kế sẵn giải pháp phân quyền dựa trên vai trò (Role-Based Access Control) đồng bộ từ Backend tới Menu Frontend:

### 5.1 Các cấp độ xác thực Route (`authType`)
Trong mỗi route, thuộc tính `detail.authType` quy định mức độ truy cập:
- `authType: 0` (hoặc không khai báo): **Public API** - Bất kỳ ai cũng có thể gọi (ví dụ: login).
- `authType: 1`: **Authentication Required** - Yêu cầu có Bearer Token JWT hợp lệ.
- `authType: 2`: **RBAC Authorization** - Yêu cầu token hợp lệ VÀ Role của người dùng phải được phân quyền thực thi API này.

### 5.2 Cơ chế sinh mã băm API Route & Macro `isAuth`
1. Khi khởi động, `packages/elysia-autoload` tự động băm đường dẫn route:
   ```typescript
   const hPath = Bun.hash.xxHash32(`${route.method}-${route.path}`);
   ```
2. Macro xác thực `isAuth` ([apps/backend/src/App.ts](apps/backend/src/App.ts)) sẽ đối chiếu mã băm này với bảng quyền `activatedRoles` (được nạp từ bảng `roles.apis` trong cơ sở dữ liệu qua [addActivatedRolePlugin.ts](apps/backend/src/addActivatedRolePlugin.ts)).
3. Endpoint đặc biệt `GET /__apis__` trả về cây danh mục toàn bộ API trong hệ thống để màn hình Quản lý Role (Frontend) có thể tích chọn và cấp quyền trực quan.

### 5.3 Xác thực đăng nhập qua `/api/auth` & Phân quyền Menu động tại Frontend
- Endpoint đăng nhập được chuẩn hóa tại `POST /api/auth` ([apps/backend/src/modules/auth/auth.routes.ts](apps/backend/src/modules/auth/auth.routes.ts)).
- Mật khẩu được băm và kiểm tra bằng hàm `hashPassword` / `verifyPassword` với Salt và HMAC-SHA256 ([apps/backend/src/shared/utils/crypto.ts](apps/backend/src/shared/utils/crypto.ts)).
- Khi đăng nhập thành công, Backend trả về token JWT cùng danh sách `menus` mà các Role của người dùng sở hữu.
- Hook `usePermissionRoutes()` ([apps/frontend/src/router/hooks/use-permission-routes.tsx](apps/frontend/src/router/hooks/use-permission-routes.tsx)) sẽ tự động ánh xạ cây Menu thành các React Router routes và hiển thị lên Sidebar điều hướng.

---

## 6. Hiện trạng Mã nguồn & Lưu ý Kỹ thuật

Khi phát triển thêm tính năng, lập trình viên cần lưu ý một số điểm kỹ thuật hiện tại của codebase để tránh lỗi không mong muốn:

1. **Quá trình cập nhật `routes-types.ts`:**
   - Khi thêm mới hoặc đổi tên một file `*.routes.ts` trong [apps/backend/src/modules/](apps/backend/src/modules/), bạn cần đảm bảo Backend server đang chạy (`bun run dev:backend`) để file `routes-types.ts` được cập nhật.
   - Nếu muốn sinh type thủ công mà không cần bật server, chạy: `bun run routes:generate` (hoặc bật watch: `bun run routes:watch`).
2. **Kiểm tra vi phạm kiến trúc tự động:**
   - Hãy chạy `bun --filter backend arch:check` để đảm bảo code mới tuân thủ nguyên tắc không gọi DB trực tiếp từ route.
3. **`initDB.ts` và dữ liệu Seed:**
   - File [apps/backend/src/initDB.ts](apps/backend/src/initDB.ts) được thiết kế để nạp dữ liệu ban đầu cho database trống. Script này **không idempotent** (không kiểm tra trùng lặp trước khi insert), do đó không chạy lại trên database đã có dữ liệu để tránh sinh bản ghi trùng hoặc lỗi unique constraint.
4. **Cơ chế nạp quyền RBAC:**
   - Danh sách quyền `activatedRoles` hiện được nạp vào bộ nhớ lúc Backend khởi động ([addActivatedRolePlugin.ts](apps/backend/src/addActivatedRolePlugin.ts)). Nếu bạn cập nhật phân quyền API cho một Role trên giao diện, cần khởi động lại Backend server để danh sách quyền trong bộ nhớ có hiệu lực.
5. **Kiểm tra kiểu dữ liệu & Kiểm thử:**
   - Chạy `bun --filter backend verify` trước khi commit mã nguồn để xác nhận đồng thời: TypeScript typecheck, kiểm tra kiến trúc và Unit tests đều đạt 100%.

---

## 7. Checklist thêm một Module mới

Khi thêm một tính năng mới (ví dụ: Quản lý Sản phẩm - `product`), hãy thực hiện theo đúng trình tự 10 bước sau:

- [ ] **1. DB Schema:** Tạo [apps/backend/src/db/schema/product-schema.ts](apps/backend/src/db/schema/product-schema.ts), khai báo bảng với `drizzle-orm/pg-core`.
- [ ] **2. Migration:** Chạy `bun run db:generate` và `bun run db:migrate`.
- [ ] **3. Module Schema & DTOs:** Tạo [apps/backend/src/modules/product/product.schema.ts](apps/backend/src/modules/product/product.schema.ts), dùng `createSelectSchema`, `createInsertSchema` từ `drizzle-typebox`.
- [ ] **4. Module Repository:** Tạo [apps/backend/src/modules/product/product.repository.ts](apps/backend/src/modules/product/product.repository.ts), viết các hàm query Drizzle DB (`findAll`, `findById`, `create`, `update`, `delete`).
- [ ] **5. Module Service & Test:** Tạo [apps/backend/src/modules/product/product.service.ts](apps/backend/src/modules/product/product.service.ts), viết pure business logic xử lý dữ liệu và ném `AppError`. Tạo [product.service.test.ts](apps/backend/src/modules/product/product.service.test.ts) để test service với mock repo.
- [ ] **6. Module Route:** Tạo [apps/backend/src/modules/product/product.routes.ts](apps/backend/src/modules/product/product.routes.ts), cấu hình routes gọi Service, thiết lập `body`, `response` validation và `detail.authType`. Khai báo `tags` trong `detail` (được editor tự động gợi ý từ `xtagGroups`; nếu cần thêm tag mới, cấu hình tại [openapi-config.ts](apps/backend/src/openapi-config.ts)).
- [ ] **7. API Contract:** Chạy `bun run routes:generate` (hoặc kiểm tra `routes-types.ts` đã tự sinh route `/api/product`).
- [ ] **8. Async Store Frontend:** Tạo [apps/frontend/src/async-store/product.ts](apps/frontend/src/async-store/product.ts), trích xuất `InferReqBodyType`, `InferResType` từ `treatyClient.api.product...`, viết các query/mutation hooks có bọc `unwrap()`.
- [ ] **9. UI Ant Design:** Xây dựng trang Ant Design tại `apps/frontend/src/pages/management/product/index.tsx`, gắn hook và truyền kiểu vào `Table<ProductItem>` và `Form<CreateProductDto>`.
- [ ] **10. Verification:** Chạy `bun --filter backend verify` và `bun run typecheck` để đảm bảo 100% tuân thủ kiến trúc, không lỗi type và vượt qua kiểm thử.
