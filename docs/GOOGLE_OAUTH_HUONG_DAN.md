# Hướng dẫn Google Login — từng bước (Supabase + Expo Go)

## Vì sao app kẹt "Đang tải phiên đăng nhập"?

Metro có thể báo:

`SecureStore is larger than 2048 bytes`

Session Google/Supabase quá lớn, **SecureStore lưu thất bại** → app không restore được session.

**Đã sửa trong code:** dùng `AsyncStorage` cho auth (`src/lib/supabase.ts`). Sau khi pull code mới:

1. Gỡ app Expo Go / xóa data app trên emulator
2. `npx expo start -c` và mở lại

---

## Màn Supabase Google — bạn đang nhầm chỗ "Mobile"

Trong ảnh của bạn, ô **Client IDs** đang ghi chữ `Mobile` → **sai**.

Ô đó cần **Client ID dạng số** từ Google Cloud, ví dụ:

`123456789012-abcdefghijklmnop.apps.googleusercontent.com`

**Client Secret** cũng phải là chuỗi bí mật từ cùng một OAuth client (Web), không phải từ tự đặt.

**Callback URL** trong Supabase (ô chỉ đọc, có nút Copy):

```
https://<project-ref>.supabase.co/auth/v1/callback
```

→ Dán URL này vào **Google Cloud Console**, không dán vào app React Native.

---

## Bước 3 — Google Cloud Console (chi tiết)

### 3.1 Tạo project Google (nếu chưa có)

1. Vào https://console.cloud.google.com/
2. Góc trên: chọn project → **New Project** → tên ví dụ `SnapChef` → Create

### 3.2 OAuth consent screen

1. Menu **APIs & Services** → **OAuth consent screen**
2. User type: **External** (cho test) → Create
3. Điền **App name** (SnapChef), **User support email** → Save and Continue
4. Scopes: Save and Continue (mặc định)
5. Test users: thêm **Gmail bạn sẽ dùng đăng nhập** → Save

### 3.3 Tạo Client ID + Secret (loại Web — bắt buộc cho Supabase)

1. **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**
2. Application type: **Web application** (không chọn Android/iOS ở bước này)
3. Name: `Supabase SnapChef`
4. **Authorized redirect URIs** → **Add URI** → dán **Copy từ Supabase** Callback URL:

   `https://sxyjmynwwqzrgedybrai.supabase.co/auth/v1/callback`

   (Dùng đúng URL trong Dashboard bạn — trong ảnh có thể là `sxvjmynwwqzrgedvbrai`, kiểm tra kỹ từng ký tự.)

5. **Create** → hiện popup:
   - **Client ID** → copy
   - **Client secret** → copy

### 3.4 Điền lại Supabase (màn hình Google của bạn)

1. Supabase → **Authentication** → **Providers** → **Google**
2. **Enable** = ON (giữ nguyên)
3. **Client IDs** → xóa chữ `Mobile`, dán **Client ID** (chuỗi `.apps.googleusercontent.com`)
4. **Client Secret** → dán **Client secret** từ Google
5. **Save**

---

## Bước 1 (làm lại) — Redirect URLs vì bạn dùng Expo Go

Terminal của bạn: `Metro waiting on exp://10.40.0.19:8081`

Khi mở app, Metro in:

```
[SnapChef] OAuth redirect URL → thêm vào Supabase Redirect URLs:
exp://10.40.0.19:8081/--/auth/callback
```

Supabase → **Authentication** → **URL Configuration** → **Redirect URLs**, thêm **tất cả**:

```
exp://10.40.0.19:8081/--/auth/callback
test2://auth/callback
https://sxyjmynwwqzrgedybrai.supabase.co/auth/v1/callback
```

(IP `10.40.0.19` đổi khi đổi WiFi — mỗi lần đổi mạng có thể phải thêm URL mới hoặc dùng development build APK với `test2://` cố định.)

**Save.**

---

## Thử lại app

```powershell
cd "d:\Tài Liệu\VAA\HK6\LT Mobile\test 2"
npx expo start -c
```

1. Đợi tối đa ~12 giây — phải qua màn loading (Welcome hoặc MainTabs)
2. **Đăng nhập** → **Đăng nhập với Google**
3. Chọn tài khoản Google (phải là email trong Test users nếu app chưa publish)

---

## Checklist

- [ ] Client IDs trong Supabase = Client ID Web từ Google (không phải "Mobile")
- [ ] Client Secret = secret từ cùng OAuth client Web
- [ ] Google redirect URI = Supabase Callback URL (Copy trong Supabase)
- [ ] Supabase Redirect URLs có dòng `exp://.../--/auth/callback` từ Metro log
- [ ] Đã `npx expo start -c` sau khi sửa code AsyncStorage
