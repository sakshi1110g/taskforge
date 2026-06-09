const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['Admin', 'Member'], default: 'Member' },
  avatar:   { type: String, default: '??' }
}, { timestamps: true });

// ── Project ───────────────────────────────────────────────────────────────────
const projectSchema = new Schema({
  name:        { type: String, required: true },
  description: { type: String, default: '' },
  color:       { type: String, default: '#6366f1' },
  ownerId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  memberIds:   [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// ── Task ──────────────────────────────────────────────────────────────────────
const taskSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
  priority:    { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  dueDate:     { type: String },
  projectId:   { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assigneeId:  { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const User    = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Task    = mongoose.model('Task', taskSchema);

module.exports = { User, Project, Task };
