const BASE = process.env.REACT_APP_API_URL || '';

const req = async (path, options = {}) => {
  const token = localStorage.getItem('tf_token');
  console.log(`API ${options.method||'GET'} ${BASE}${path}`);
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await res.json();
  console.log(`API response ${res.status}:`, data);
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
  return data;
};

export const api = {
  login:         (b) => req('/api/auth/login',   { method: 'POST', body: JSON.stringify(b) }),
  signup:        (b) => req('/api/auth/signup',  { method: 'POST', body: JSON.stringify(b) }),
  getProjects:   ()  => req('/api/projects'),
  createProject: (b) => req('/api/projects',     { method: 'POST', body: JSON.stringify(b) }),
  deleteProject: (id)=> req(`/api/projects/${id}`,{ method: 'DELETE' }),
  getTasks:      ()  => req('/api/tasks'),
  createTask:    (b) => req('/api/tasks',        { method: 'POST', body: JSON.stringify(b) }),
  updateTask:  (id,b)=> req(`/api/tasks/${id}`,  { method: 'PUT',  body: JSON.stringify(b) }),
  deleteTask:    (id)=> req(`/api/tasks/${id}`,  { method: 'DELETE' }),
  getUsers:      ()  => req('/api/users'),
  inviteUser:    (b) => req('/api/users/invite', { method: 'POST', body: JSON.stringify(b) }),
};
