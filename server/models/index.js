const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite::memory:', {
  dialect: process.env.DATABASE_URL ? 'postgres' : 'sqlite',
  dialectOptions: process.env.DATABASE_URL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  logging: false
});

const User = sequelize.define('User', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.ENUM('Admin', 'Member'), defaultValue: 'Member' },
  avatar:   { type: DataTypes.STRING(4), defaultValue: '??' }
});

const Project = sequelize.define('Project', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:        { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  color:       { type: DataTypes.STRING(10), defaultValue: '#6366f1' },
  ownerId:     { type: DataTypes.UUID, allowNull: false }
});

const ProjectMember = sequelize.define('ProjectMember', {}, { timestamps: false });

const Task = sequelize.define('Task', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status:      { type: DataTypes.ENUM('Todo', 'In Progress', 'Done'), defaultValue: 'Todo' },
  priority:    { type: DataTypes.ENUM('High', 'Medium', 'Low'), defaultValue: 'Medium' },
  dueDate:     { type: DataTypes.DATEONLY },
  projectId:   { type: DataTypes.UUID, allowNull: false },
  assigneeId:  { type: DataTypes.UUID },
  createdBy:   { type: DataTypes.UUID }
});

Project.belongsToMany(User, { through: ProjectMember, as: 'members', foreignKey: 'projectId' });
User.belongsToMany(Project, { through: ProjectMember, as: 'projects', foreignKey: 'userId' });
Task.belongsTo(Project, { foreignKey: 'projectId' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
Project.hasMany(Task, { foreignKey: 'projectId' });

module.exports = { sequelize, User, Project, ProjectMember, Task };
