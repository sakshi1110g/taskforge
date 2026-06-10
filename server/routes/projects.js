const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { Project, Task, User } = require('../models');
const mongoose = require('mongoose');

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
      return { ...obj, id: p._id.toString(), members: (obj.memberIds||[]).map(m => ({...m, id: m._id ? m._id.toString() : m})) };
    });
    res.json(result);
  } catch (e) { console.error('GET /projects error:', e); res.status(500).json({ error: e.message }); }
});

// POST /api/projects
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    console.log('POST /projects body:', JSON.stringify(req.body));
    console.log('User from token:', JSON.stringify(req.user));

    const { name, description, color, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    // Only include valid ObjectIds
    const rawIds = [req.user.id, ...(memberIds || [])];
    console.log('Raw IDs to validate:', rawIds);

    const safeIds = rawIds.filter(id => {
      try { return mongoose.Types.ObjectId.isValid(id); }
      catch { return false; }
    });
    console.log('Safe IDs:', safeIds);

    const project = await Project.create({
      name,
      description: description || '',
      color: color || '#6366f1',
      ownerId: req.user.id,
      memberIds: safeIds
    });

    const full = await Project.findById(project._id).populate('memberIds', '_id name email role avatar');
    const obj = full.toObject();
    const response = { ...obj, id: full._id.toString(), members: (obj.memberIds||[]).map(m => ({...m, id: m._id.toString()})) };
    console.log('Project created successfully:', project._id);
    res.status(201).json(response);
  } catch (e) {
    console.error('POST /projects error:', e);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
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
