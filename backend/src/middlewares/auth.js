const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/jwt');

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      throw new AppError('Chưa đăng nhập', 401);
    }
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 401);
    }
    req.user = user;
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return next(new AppError('Phiên đăng nhập hết hạn', 401));
    }
    next(e);
  }
}

module.exports = { authenticate };
