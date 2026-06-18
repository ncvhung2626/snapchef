export type FieldErrors = Record<string, string>;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateEmail(email: string): string | undefined {
  const v = email.trim();
  if (!v) return 'Nhập email';
  if (!isValidEmail(v)) return 'Email không hợp lệ';
  return undefined;
}

export function validatePassword(password: string, min = 6): string | undefined {
  if (!password) return 'Nhập mật khẩu';
  if (password.length < min) return `Mật khẩu tối thiểu ${min} ký tự`;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Mật khẩu nên có chữ và số';
  }
  return undefined;
}

export function validatePasswordSimple(password: string, min = 6): string | undefined {
  if (!password) return 'Nhập mật khẩu';
  if (password.length < min) return `Mật khẩu tối thiểu ${min} ký tự`;
  return undefined;
}

export function validateFullname(name: string): string | undefined {
  const v = name.trim();
  if (!v) return 'Nhập họ tên';
  if (v.length < 2) return 'Họ tên quá ngắn';
  return undefined;
}

export function validateLoginForm(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const e = validateEmail(email);
  const p = validatePasswordSimple(password);
  if (e) errors.email = e;
  if (p) errors.password = p;
  return errors;
}

export function validateRegisterForm(
  fullname: string,
  email: string,
  password: string,
  confirm: string,
  acceptedTerms: boolean
): FieldErrors {
  const errors: FieldErrors = {};
  const n = validateFullname(fullname);
  const e = validateEmail(email);
  const p = validatePassword(password);
  if (n) errors.fullname = n;
  if (e) errors.email = e;
  if (p) errors.password = p;
  if (password !== confirm) errors.confirm = 'Mật khẩu không khớp';
  if (!acceptedTerms) errors.terms = 'Bạn cần đồng ý điều khoản';
  return errors;
}

export function validateRecipeDraft(input: {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.title.trim()) errors.title = 'Nhập tên món';
  if (!input.description.trim()) errors.description = 'Nhập mô tả ngắn';
  const ings = input.ingredients.map((i) => i.trim()).filter(Boolean);
  if (ings.length === 0) errors.ingredients = 'Thêm ít nhất 1 nguyên liệu';
  const steps = input.steps.map((s) => s.trim()).filter(Boolean);
  if (steps.length === 0) errors.steps = 'Thêm ít nhất 1 bước nấu';
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
