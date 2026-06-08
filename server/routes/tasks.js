const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { Task, User, Project } = require('../models');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const where = req.user.role === 'Admin' ? {} : { assigneeId: req.user.id };
    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id','name','avatar'] },
        { model: Project, attributes: ['id','name','color'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tasks
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;
    if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId required' });
    const task = await Task.create({ title, description, projectId, assigneeId, status, priority, dueDate, createdBy: req.user.id });
    const full = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id','name','avatar'] }, { model: Project, attributes: ['id','name','color'] }]
    });
    res.status(201).json(full);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'Admin' && task.assigneeId !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });
    await task.update(req.body);
    res.json(task);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    await task.destroy();
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
