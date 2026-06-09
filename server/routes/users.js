const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { User } = require('../models');

// GET /api/users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users.map(u => ({ ...u.toObject(), id: u._id })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users/invite
router.post('/invite', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const user = await User.create({ name, email, password: hash, role: role || 'Member', avatar });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
