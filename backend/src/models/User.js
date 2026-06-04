const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    refreshToken: { type: String, select: false, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id.toString(),
    fullname: this.fullname,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    role: this.role,
    followers: this.followers.map((id) => id.toString()),
    following: this.following.map((id) => id.toString()),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
