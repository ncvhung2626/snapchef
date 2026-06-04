# Phân tích & Lập kế hoạch phát triển SnapChef (CookCircle)

> Tài liệu được tạo theo yêu cầu **SnapChef Project Analysis.docx** — vai trò Senior Software Architect.  
> Mobile: **Expo SDK 54** + React Native + TypeScript. Giai đoạn hiện tại: **mock data** (sẵn sàng nối backend).

---

## PHẦN 1 — PHÂN TÍCH HIỆN TRẠNG

### Kiến trúc hiện tại
- **Frontend:** Expo 54, React Navigation (Stack + Bottom Tabs), TypeScript, theme M3 (`src/theme/`).
- **State:** `AuthContext` (mock login), hooks (`useFeed`), services mock (`src/services/`).
- **Data:** Mock tập trung `src/data/mock/` — map 1:1 với MongoDB collections (Phần 3).
- **Native:** Thư mục `android/` (prebuild) — chạy Android Studio / `npm run android`.

### Điểm mạnh
- UI 13 màn hình Stitch đã có khung (Welcome, Login, Home, Reels, Create Post, Inbox, Profile, Post Detail, Comment, Group, Create Group, Post/Member Management).
- Design system thống nhất (`DESIGN.md` + theme tokens).
- Tab bar tùy biến với FAB “Đăng bài” mở **modal stack** (đúng DESIGN.md).
- Cấu trúc mở rộng: types, services, navigation tách module.

### Điểm yếu
- Chưa có backend thật (JWT, upload, Socket.IO).
- Một số màn còn hardcode màu (`HomeScreen` discover cards — cần dần chuyển sang theme).
- Reels/Inbox chưa nối API; chat chỉ UI.

### Đã làm được (~45% tổng dự án)
| Module | UI | Logic mock | API |
|--------|-----|------------|-----|
| Auth | ✅ | ✅ login mock | ❌ |
| Home/Feed | ✅ | ✅ `useFeed` | ❌ |
| Post/Create | ✅ | ⚠️ partial | ❌ |
| Reels | ✅ | UI only | ❌ |
| Group | ✅ | ✅ navigate + admin UI | ❌ |
| Inbox | ✅ | mock list | ❌ |
| Profile | ✅ | static | ❌ |
| Comment | ✅ | mock | ❌ |

### Chưa làm được
- Register, OAuth Google/Facebook, refresh token.
- Upload Cloudinary, video Reels thật.
- Realtime chat, push notification.
- Admin dashboard web.

### Rủi ro kỹ thuật
- Đường dẫn project có dấu/khoảng trắng → `expo prebuild` có thể lỗi.
- Expo Go giới hạn so với dev build (native config).
- New Architecture (RN 0.81) — test kỹ trên thiết bị thật.

### Thiết kế tiềm ẩn
- Trùng mock posts giữa Home và GroupDetail — nên dùng chung `postService`.
- Tab “Khám phá” chưa có feed riêng (hiện dùng UI nhóm ngang).

### Chức năng còn thiếu (ưu tiên)
1. API Auth + Profile edit  
2. CRUD Post + upload media  
3. Like/Comment API  
4. Group join/leave + phân quyền  
5. Notifications + Chat realtime  

---

## PHẦN 2 — KIẾN TRÚC TỔNG THỂ

```
Mobile App (Expo) ──REST──► API Gateway (Express)
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              Auth Service  Post Service  Group Service
                    │           │           │
                    └───────────┴───────────┘
                                ▼
                            MongoDB

Mobile App ──Socket.IO──► Realtime Server (chat, typing, online)
```

**Luồng chính (tóm tắt):**
- **Auth:** Login → JWT access + refresh → lưu secure store → header `Authorization`.
- **Feed:** `GET /posts?tab=forYou` → cache FlatList → pull refresh.
- **Post:** Form → upload Cloudinary → `POST /posts` → invalidate feed.
- **Comment:** `POST /posts/:id/comments` → nested reply qua `parentComment`.
- **Group:** `POST /groups/:id/join` → cập nhật `members[]`.
- **Notification:** `GET /notifications` → badge Inbox → `PUT .../read`.
- **Chat:** `join-conversation` → `send-message` → persist `Message` → `receive-message`.

---

## PHẦN 3 — MONGODB

Collections: **User, Post, Comment, Like, Group, Notification, Conversation, Message, SavedRecipe** (schema chi tiết như DOCX).

**Quan hệ:** User 1—N Post; Post 1—N Comment; Group N—N User; Conversation N—N User.

**Index gợi ý:** `Post.createdAt`, `Post.author`, `Notification.receiver+isRead`, `Message.conversationId+createdAt`.

**Populate:** Post.author → User; Comment.userId → User.

**Cascade:** Xóa Post → xóa Comment/Like liên quan; xóa User → soft-delete hoặc anonymize posts.

---

## PHẦN 4 — BACKEND (kế hoạch)

**Stack:** Node.js, Express, Mongoose, JWT, bcrypt, Cloudinary, Socket.IO.

```
backend/src/
  config/       # db, cloudinary, env
  controllers/  # HTTP handlers
  routes/       # REST routers
  middlewares/  # auth, validate, error
  services/     # business logic
  repositories/ # DB access
  models/       # Mongoose schemas
  validators/   # Joi/Zod
  sockets/      # Socket.IO handlers
  utils/
```

---

## PHẦN 5 — REST API (danh mục)

| Nhóm | Endpoints |
|------|-----------|
| Auth | POST register/login/refresh/logout, GET profile |
| User | GET/PUT users/:id, follow/unfollow |
| Post | CRUD posts, like/unlike |
| Comment | CRUD comments on post |
| Group | CRUD, join, leave |
| Notification | GET list, PUT read |
| Chat | GET conversations, GET/POST messages |

Mỗi endpoint: Request body, Response JSON, Validation, Middleware `authenticate`, Error `{ code, message }`.

---

## PHẦN 6 — SOCKET.IO

Events: `join-conversation`, `leave-conversation`, `send-message`, `receive-message`, `typing`, `stop-typing`, `online`, `offline`.

Payload `send-message`: `{ conversationId, content, attachments? }`. Lưu DB trước/sau emit tùy ack. Reconnect: gửi lại `join-conversation` + sync missed messages qua REST.

---

## PHẦN 7 — CLOUDINARY

- Avatar: folder `avatars/`, transform 200×200.
- Post image: `posts/images/`.
- Reel video: `reels/`, eager thumbnail.
- Delete: `destroy(public_id)` khi xóa post.

---

## PHẦN 8 — REACT NATIVE (đã áp dụng)

```
src/
  screens/       # 13+ màn hình
  components/    # AppHeader, PostCard, ...
  navigation/    # RootNavigator
  services/      # authService, postService, groupService (mock)
  context/       # AuthContext
  hooks/         # useFeed
  constants/     # routes, API_BASE_URL
  types/         # models, navigation
  data/mock/     # seed data
  theme/         # colors, typography, spacing, radius, shadows
  utils/         # formatTime
```

**State:** Context cho auth; hooks cho màn hình; có thể thêm Zustand khi scale.

**Token:** `expo-secure-store` khi có backend.

---

## PHẦN 9 — PHÂN TÍCH TỪNG MÀN HÌNH

| Màn hình | Đã có | Thiếu | API sau này |
|----------|-------|-------|-------------|
| WelcomeScreen | Splash, CTA | Animation | — |
| LoginScreen | Form, mock login | Register, OAuth | POST /auth/login |
| HomeScreen | Tabs, feed, groups | Search, infinite scroll | GET /posts |
| CreatePostScreen | Form, media UI | Upload, validate | POST /posts |
| ReelsScreen | TikTok UI | Video player | GET reels |
| InboxScreen | Noti + message tabs | Realtime, read state | GET /notifications |
| ProfileScreen | Stats, empty saved | Edit profile, posts grid | GET /users/:id |
| PostDetailScreen | Full post, actions | Like state sync | GET /posts/:id |
| CommentScreen | List, input | Post comment API | POST comments |
| GroupDetailScreen | Cover, posts, admin | Join API | GET /groups/:id |
| CreateGroupScreen | Form UI | POST group | POST /groups |
| PostManagementScreen | List, delete mock | Moderation API | DELETE /posts/:id |
| MemberManagementScreen | List, remove mock | Roles API | PUT group members |

---

## PHẦN 10 — ROADMAP (8 Sprint, nhóm 5 người)

| Sprint | Nội dung | Deliverable |
|--------|----------|-------------|
| 1 | Auth FE+BE | Login/Register JWT |
| 2 | Profile | Edit avatar, follow |
| 3 | Posts | Feed CRUD + Cloudinary |
| 4 | Comments + Likes | Tương tác bài viết |
| 5 | Groups | Join, admin |
| 6 | Notifications | Inbox API |
| 7 | Chat | Socket.IO |
| 8 | Deploy | EAS + API host |

---

## PHẦN 11 — ADMIN DASHBOARD

React web: Users, Posts, Groups, Reports, Analytics. RBAC: Admin / Moderator / User.

---

## PHẦN 12 — TÍNH NĂNG NÂNG CAO

AI gợi ý món, Meal Planner, Calories, OCR nguyên liệu, Recommendation, Top Creator — ưu tiên sau MVP.

---

## PHẦN 13 — DANH SÁCH CÔNG VIỆC

### File đã tạo mới (frontend)
- `SNAPCHEF_PROJECT_ANALYSIS.md`
- `src/types/models.ts`, `navigation.ts`
- `src/constants/routes.ts`
- `src/data/mock/*`
- `src/services/*`
- `src/context/AuthContext.tsx`
- `src/hooks/useFeed.ts`
- `src/navigation/RootNavigator.tsx`
- `src/screens/WelcomeScreen.tsx`, `PostDetailScreen.tsx`, `PostManagementScreen.tsx`, `MemberManagementScreen.tsx`
- `src/theme/shadows.ts`, `src/utils/formatTime.ts`

### File đã chỉnh sửa
- `App.tsx`, `package.json` (scripts)
- `src/components/BottomTabBar.tsx`, `PostCard.tsx`
- `src/screens/LoginScreen.tsx`, `HomeScreen.tsx`, `GroupDetailScreen.tsx`, `CreatePostScreen.tsx`
- `src/theme/spacing.ts`

### Backend (chưa tạo — Sprint 1+)
- Toàn bộ `backend/` theo Phần 4.

### Ưu tiên triển khai tiếp
1. `expo-secure-store` + API client axios/fetch wrapper  
2. Register screen  
3. Nối `CreatePostScreen` → `postService.createPost`  
4. Backend Sprint 1 song song  

---

## Cách chạy & kiểm thử

```powershell
cd "d:\Tài Liệu\VAA\HK6\LT Mobile\test 2"
npm start
```

1. **Welcome** → Bắt đầu → **Login** (email bất kỳ) → **MainTabs**  
2. Tab **Trang chủ** → tab “Dành cho bạn” → thấy feed `PostCard`  
3. Nút **+** giữa tab bar → **Đăng bài** (modal)  
4. Tap bài viết → **Chi tiết** → **Bình luận**  
5. Nhóm → **GroupDetail** → **Quản lý thành viên / bài đăng**

---

*Tài liệu này là deliverable Phần 1–13 của DOCX; code mobile đã được cập nhật theo Phần 8–9 và ưu tiên Phần 13.*
