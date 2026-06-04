# Sprint 1 — Authentication

> **Khuyến nghị:** Dùng **Supabase** — xem [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).  
> Không cần MongoDB hay `npm run backend`.

## Supabase (mặc định)

1. Tạo project trên [supabase.com](https://supabase.com)
2. Chạy `supabase/schema.sql` trong SQL Editor
3. Điền `.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. `npm start` → Đăng ký / Đăng nhập

---

## Backend Express (`backend/`) — tùy chọn

### Cài đặt

```powershell
cd "d:\Tài Liệu\VAA\HK6\LT Mobile\test 2"
npm run backend:install
copy backend\.env.example backend\.env
```

Chỉnh `backend/.env` (JWT secret ≥ 32 ký tự). Cần **MongoDB** chạy tại `mongodb://127.0.0.1:27017`.

### Chạy API

```powershell
npm run backend:seed
npm run backend
```

Health: `GET http://localhost:5000/api/health`

### API Auth

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/auth/register` | `{ fullname, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| POST | `/api/auth/refresh-token` | `{ refreshToken }` |
| POST | `/api/auth/logout` | Bearer access token |
| GET | `/api/auth/profile` | Bearer access token |

**Tài khoản demo:** `demo@snapchef.app` / `123456`

## Mobile App

### Cấu hình API URL

Tạo file `.env` (copy từ `.env.example`):

- **Emulator Android:** `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api`
- **Máy thật (Expo Go):** `EXPO_PUBLIC_API_URL=http://<IP-LAN-MÁY-TÍNH>:5000/api`

```powershell
npx expo install expo-secure-store
npm start
```

### Luồng test

1. Welcome → Đăng nhập / Đăng ký  
2. Đăng ký tài khoản mới hoặc demo@snapchef.app  
3. Đóng app mở lại → tự đăng nhập (secure store)  
4. Cá nhân → Đăng xuất  

### Kiểm thử API (curl)

```bash
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"demo@snapchef.app\",\"password\":\"123456\"}"
```
