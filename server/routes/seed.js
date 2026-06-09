const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// GET /api/seed — creates demo users if they don't exist
router.get('/', async (req, res) => {
  try {
    const existing = await User.findOne({ email: 'admin@demo.com' });
    if (existing) return res.json({ message: 'Already seeded ✅' });

    const users = [
      { name: 'Admin User',  email: 'admin@demo.com',  password: await bcrypt.hash('admin123', 10),  role: 'Admin',  avatar: 'AU' },
      { name: 'Sam Member',  email: 'member@demo.com', password: await bcrypt.hash('member123', 10), role: 'Member', avatar: 'SM' },
    ];
    await User.insertMany(users);
    res.json({ message: 'Seeded demo users ✅', users: ['admin@demo.com / admin123', 'member@demo.com / member123'] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
