const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { Project, Task, User } = require('../models');

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      projects = await Project.find().populate('memberIds', 'id name email role avatar');
    } else {
      projects = await Project.find({ memberIds: req.user.id }).populate('memberIds', 'id name email role avatar');
    }
    // Attach members array for frontend compatibility
    const result = projects.map(p => ({
      ...p.toObject(),
      id: p._id,
      members: p.memberIds
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/projects
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, color, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const ids = [...new Set([req.user.id, ...(memberIds || [])])];
    const project = await Project.create({ name, description, color, ownerId: req.user.id, memberIds: ids });
    const full = await Project.findById(project._id).populate('memberIds', 'id name email role avatar');
    res.status(201).json({ ...full.toObject(), id: full._id, members: full.memberIds });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Task.deleteMany({ projectId: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
