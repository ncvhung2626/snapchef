require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const { connectDB } = require('./config/db');

async function seed() {
  await connectDB();
  const email = 'demo@snapchef.app';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('[Seed] Demo user already exists:', email);
    process.exit(0);
  }
  await User.create({
    fullname: 'Đầu bếp Demo',
    email,
    password: await bcrypt.hash('123456', 12),
    bio: 'Tài khoản demo Sprint 1 — SnapChef',
  });
  console.log('[Seed] Created demo user:', email, '/ password: 123456');
  await mongoose.disconnect();
}

seed().catch((e) => {
  if (e.name === 'MongooseServerSelectionError') {
    console.error('\n[Seed] Không kết nối được MongoDB tại', process.env.MONGODB_URI);
    console.error('       → Cài/chạy MongoDB local HOẶC đổi MONGODB_URI trong backend/.env (Atlas).');
    console.error('       → Windows: mở Services và Start "MongoDB Server", hoặc chạy mongod.\n');
  } else {
    console.error(e);
  }
  process.exit(1);
});
