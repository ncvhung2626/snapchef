# Sprint 8 — Deploy (Expo EAS)

Build file cài được trên điện thoại (APK Android) hoặc bản production lên Store.

## Chuẩn bị (một lần)

### 1. Tài khoản Expo

1. Đăng ký [https://expo.dev](https://expo.dev)
2. Cài EAS CLI (PowerShell):

```powershell
npm install -g eas-cli
eas login
```

### 2. Liên kết project EAS

Trong thư mục dự án:

```powershell
cd "d:\Tài Liệu\VAA\HK6\LT Mobile\test 2"
eas init
```

- Chọn **Create a new project** (hoặc link project có sẵn)
- Project đã tạo: [@pucser/test-2](https://expo.dev/accounts/pucser/projects/test-2)
- `projectId` đã gắn trong `app.config.js`: `01237313-53c8-42cc-be6d-f8ffe51d2620`

### 3. Biến môi trường trên EAS (quan trọng)

Build trên cloud **không** đọc file `.env` trên máy bạn. Phải khai báo trên EAS:

```powershell
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://sxyjmynwwqzrgedybrai.supabase.co" --environment preview --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "PASTE_ANON_KEY_CUA_BAN" --environment preview --environment production --visibility sensitive
```

Hoặc: [expo.dev](https://expo.dev) → project → **Environment variables** → thêm 2 biến trên cho **preview** và **production**.

### 4. Supabase cho bản build

Trên Supabase Dashboard (giữ nguyên project dev hoặc tạo project production riêng):

- Đã chạy đủ SQL sprint 1 → 7
- **Authentication** → URL Configuration: có thể thêm redirect nếu dùng magic link (email/password thì thường không cần)
- Storage buckets `post-images`, `group-images` public read như trong SQL

---

## Build APK để cài thử (khuyến nghị trước)

```powershell
cd "d:\Tài Liệu\VAA\HK6\LT Mobile\test 2"
eas build --profile preview --platform android
```

- Lần đầu hỏi keystore → chọn **Let Expo generate** (Expo quản lý)
- Xong: link tải **APK** trên trang build → cài lên Android

---

## Build production (Play Store)

```powershell
eas build --profile production --platform android
```

Ra file **AAB**. Upload lên Google Play Console.

iOS (cần Apple Developer):

```powershell
eas build --profile production --platform ios
eas submit --platform ios
```

---

## Script npm trong project

| Lệnh | Ý nghĩa |
|------|---------|
| `npm run build:preview:android` | APK nội bộ |
| `npm run build:prod:android` | AAB production |
| `npm run build:prod:ios` | IPA production |

---

## Kiểm tra trước khi build

```powershell
npx expo start -c
```

- Đăng nhập / đăng ký OK
- Đăng bài, nhóm, thông báo, chat OK

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Invalid supabaseUrl trên bản build | Thiếu `EXPO_PUBLIC_*` trên EAS → làm bước 3 |
| `eas: command not found` | `npm install -g eas-cli` |
| Chat không realtime trên APK | Supabase → Replication → bật `messages` (bạn đã làm) |
| Gradle build failed / Run gradlew | Thư mục `android/` prebuild lỗi trên máy → xóa khỏi git, để EAS tự prebuild (xem mục dưới) |
| Đường dẫn Unicode khi prebuild local | Dùng **EAS Build trên cloud**, không commit `android/` |

---

## Fix lỗi Gradle build failed (EAS_BUILD_UNKNOWN_GRADLE_ERROR)

**Nguyên nhân:** Project có thư mục native **lỗi** được commit:

- `android/` (root) — package Kotlin sai
- **`package/android/`** — template HelloWorld cũ (EAS vẫn phát hiện → Gradle fail)

**Cách sửa:**

1. Gỡ `android/` và `package/` khỏi git
2. Build lại — EAS tự `expo prebuild` trên cloud

```powershell
cd "d:\Tài Liệu\VAA\HK6\LT Mobile\test 2"
git rm -r --cached android package
git add .gitignore .easignore SPRINT8_DEPLOY.md
git commit -m "fix: remove package/android from git for EAS prebuild"
npm run build:preview:android
```

Build **thành công** khi log **không còn** dòng *android directory was detected*.
