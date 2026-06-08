# ⚡ TaskForge — Team Task Manager

A full-stack team task management app with role-based access control.

## 🚀 Live Demo
> [Live URL here after deployment]

## ✨ Features
- **Authentication** — Signup/Login with JWT tokens
- **Projects** — Create, manage, color-code projects with team members
- **Tasks** — Create, assign, track status (Todo → In Progress → Done)
- **Dashboard** — Stats, progress bars, overdue alerts
- **Role-Based Access** — Admin (full control) vs Member (own tasks)
- **Team Management** — Invite members, view stats per user

## 🛠 Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18, CSS-in-JS |
| Backend | Node.js, Express |
| Database | PostgreSQL (Sequelize ORM) |
| Auth | JWT + bcrypt |
| Deployment | Render.com |

## 📁 Structure
```
taskforge/
├── client/          # React frontend
│   └── src/
│       ├── App.jsx  # Main app
│       └── api.js   # API client
└── server/          # Express backend
    ├── index.js     # Entry point
    ├── models/      # Sequelize models
    ├── routes/      # REST API routes
    └── middleware/  # Auth + role guards
```

## 🔌 API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/signup | — | Register user |
| POST | /api/auth/login | — | Login, get JWT |
| GET | /api/projects | ✅ | List projects |
| POST | /api/projects | Admin | Create project |
| DELETE | /api/projects/:id | Admin | Delete project |
| GET | /api/tasks | ✅ | List tasks |
| POST | /api/tasks | Admin | Create task |
| PUT | /api/tasks/:id | ✅ | Update task |
| DELETE | /api/tasks/:id | Admin | Delete task |
| GET | /api/users | ✅ | List team |
| POST | /api/users/invite | Admin | Add member |

## 🏃 Run Locally
```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/taskforge.git
cd taskforge

# 2. Setup server
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL + JWT_SECRET
npm run dev

# 3. Setup client (new terminal)
cd client
npm install
npm start
```

## ☁️ Deploy on Render
1. Push to GitHub
2. Go to render.com → **New → Blueprint**
3. Connect your repo — it auto-reads `render.yaml`
4. Add a free **PostgreSQL** database, copy URL to `DATABASE_URL`
5. Deploy!

## 👤 Demo Credentials
- **Admin:** admin@demo.com / admin123  
- **Member:** member@demo.com / member123
