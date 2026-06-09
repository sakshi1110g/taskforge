const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { Task } = require('../models');

const populate = (q) => q
  .populate('assigneeId', 'id name avatar')
  .populate('projectId', 'id name color');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { assigneeId: req.user.id };
    const tasks = await populate(Task.find(filter).sort({ createdAt: -1 }));
    const result = tasks.map(t => ({
      ...t.toObject(),
      id: t._id,
      assignee: t.assigneeId,
      Project: t.projectId,
      projectId: t.projectId?._id || t.projectId
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tasks
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId required' });
    const task = await Task.create({ title, description, projectId, assigneeId, status, priority, dueDate, createdBy: req.user.id });
    const full = await populate(Task.findById(task._id));
    res.status(201).json({ ...full.toObject(), id: full._id, assignee: full.assigneeId, Project: full.projectId, projectId: full.projectId?._id || full.projectId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'Admin' && String(task.assigneeId) !== String(req.user.id))
      return res.status(403).json({ error: 'Forbidden' });
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updated.toObject(), id: updated._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
