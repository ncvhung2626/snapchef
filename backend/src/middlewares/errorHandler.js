const AppError = require('../utils/AppError');

function errorHandler(err, _req, res, _next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
  }
  console.error('[API Error]', err);
  return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
}

function notFound(_req, _res, next) {
  next(new AppError('Không tìm thấy API', 404));
}

module.exports = { errorHandler, notFound };
