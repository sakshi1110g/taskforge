const router = require('express').Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { Project, User, Task, ProjectMember } = require('../models');

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const where = req.user.role === 'Admin' ? {} : undefined;
    let projects;
    if (req.user.role === 'Admin') {
      projects = await Project.findAll({ include: [{ model: User, as: 'members', attributes: ['id','name','email','role','avatar'] }] });
    } else {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Project, as: 'projects', include: [{ model: User, as: 'members', attributes: ['id','name','email','role','avatar'] }] }]
      });
      projects = user.projects;
    }
    res.json(projects);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/projects
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description, color, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const project = await Project.create({ name, description, color, ownerId: req.user.id });
    const ids = [...new Set([req.user.id, ...(memberIds || [])])];
    await project.setMembers(ids);
    const full = await Project.findByPk(project.id, { include: [{ model: User, as: 'members', attributes: ['id','name','email','role','avatar'] }] });
    res.status(201).json(full);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Not found' });
    await Task.destroy({ where: { projectId: project.id } });
    await project.destroy();
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
