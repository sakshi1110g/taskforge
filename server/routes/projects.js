const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { Project, Task, User } = require('../models');

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'Admin') {
      projects = await Project.find().populate('memberIds', '_id name email role avatar');
    } else {
      projects = await Project.find({ memberIds: req.user.id }).populate('memberIds', '_id name email role avatar');
    }
    const result = projects.map(p => {
      const obj = p.toObject();
      return { ...obj, id: p._id.toString(), members: obj.memberIds.map(m => ({...m, id: m._id.toString()})) };
    });
    res.json(result);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// POST /api/projects
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, color, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    
    // Combine current user + provided memberIds, filter out invalid ones
    const rawIds = [req.user.id, ...(memberIds || [])];
    // Validate all IDs exist in DB
    const validUsers = await User.find({ _id: { $in: rawIds } }).select('_id');
    const validIds = validUsers.map(u => u._id);

    const project = await Project.create({ name, description, color, ownerId: req.user.id, memberIds: validIds });
    const full = await Project.findById(project._id).populate('memberIds', '_id name email role avatar');
    const obj = full.toObject();
    res.status(201).json({ ...obj, id: full._id.toString(), members: obj.memberIds.map(m => ({...m, id: m._id.toString()})) });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
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
