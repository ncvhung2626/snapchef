const express = require('express');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'SnapChef API is running' });
});

router.use('/auth', authRoutes);

module.exports = router;
