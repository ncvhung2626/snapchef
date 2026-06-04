const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

async function issueTokens(user) {
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();
  return { accessToken, refreshToken };
}

exports.register = async (req, res, next) => {
  try {
    const { fullname, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      throw new AppError('Email đã được sử dụng', 409);
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ fullname, email, password: hashed });
    const tokens = await issueTokens(user);
    res.status(201).json({
      success: true,
      data: { user: user.toPublicJSON(), ...tokens },
    });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }
    const tokens = await issueTokens(user);
    res.json({
      success: true,
      data: { user: user.toPublicJSON(), ...tokens },
    });
  } catch (e) {
    next(e);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub).select('+refreshToken');
    if (!user || !user.refreshToken) {
      throw new AppError('Refresh token không hợp lệ', 401);
    }
    const match = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!match) {
      throw new AppError('Refresh token không hợp lệ', 401);
    }
    const accessToken = signAccessToken(user._id.toString());
    res.json({ success: true, data: { accessToken } });
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token hết hạn', 401));
    }
    next(e);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (e) {
    next(e);
  }
};

exports.getProfile = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
};
