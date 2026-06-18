# Phase 24 — Testing

## Công cụ đề xuất

- **Unit:** Jest + `@testing-library/react-native`
- **Integration:** mock Supabase client trong repository tests
- **E2E:** Maestro hoặc Detox (sau khi flow ổn định)

## Test cases (bắt buộc trước release)

### Auth (T-A*)

| ID | Input | Expected |
|----|-------|----------|
| T-A1 | email invalid | Zod error |
| T-A2 | password < 6 login | Zod error |
| T-A3 | register weak password | Zod: cần chữ + số |
| T-A4 | logout | session null, Welcome screen |

### Posts (T-P*)

| ID | Case | Expected |
|----|------|----------|
| T-P1 | create empty recipe | validation fail |
| T-P2 | soft delete own post | không hiện feed |
| T-P3 | user B edit post A | RLS / service deny |
| T-P4 | infinite scroll | không duplicate page |

### RLS (T-R*)

| ID | Case |
|----|------|
| T-R1 | read messages not in conversation → empty/deny |
| T-R2 | insert report as anonymous → deny |

### Realtime (T-RT*)

| ID | Case |
|----|------|
| T-RT1 | new message appears in Chat without reload |

## Chạy (khi đã cài Jest)

```bash
npm test
```

Hiện project chưa có `jest.config` — thêm ở tuần 12.
