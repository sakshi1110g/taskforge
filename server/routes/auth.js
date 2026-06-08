const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const sign = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role, name: user.name, avatar: user.avatar },
  process.env.JWT_SECRET || 'dev_secret',
  { expiresIn: '7d' }
);

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const user = await User.create({ name, email, password: hash, role: role || 'Member', avatar });
    res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
