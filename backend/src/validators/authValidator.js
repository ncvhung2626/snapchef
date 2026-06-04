const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const registerRules = [
  body('fullname').trim().notEmpty().withMessage('Họ tên là bắt buộc').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
];

const refreshRules = [body('refreshToken').notEmpty().withMessage('Thiếu refresh token')];

function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join(', ');
    return next(new AppError(message, 400));
  }
  next();
}

module.exports = { registerRules, loginRules, refreshRules, validate };
