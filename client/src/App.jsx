import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api";

const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ─── Design Tokens ────────────────────────────────────────────────────────────
const G = {
  bg: "#0a0f1e", surface: "#111827", card: "#1a2236", border: "#1e2d45",
  accent: "#6366f1", accent2: "#818cf8", text: "#e2e8f0", muted: "#64748b",
  danger: "#ef4444", success: "#22c55e", warning: "#f59e0b",
};
const statusColor = { "Todo": "#64748b", "In Progress": "#6366f1", "Done": "#22c55e" };
const priorityColor = { "High": "#ef4444", "Medium": "#f59e0b", "Low": "#3b82f6" };
const today = () => new Date().toISOString().split("T")[0];
const isOverdue = (d, s) => s !== "Done" && d < today();
const uid = () => Math.random().toString(36).slice(2,9);

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:'DM Sans',sans-serif}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:${G.bg}}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:2px}
  input,select,textarea{font-family:'DM Sans',sans-serif}
  .syne{font-family:'Syne',sans-serif}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .fade-up{animation:fadeUp 0.35s ease forwards}
`;

// ─── Tiny UI ──────────────────────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span style={{ background: color+"22", color, border:`1px solid ${color}44`, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{label}</span>
);
const Avatar = ({ initials, color=G.accent, size=32 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:color+"33", border:`2px solid ${color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.34, fontWeight:700, color, flexShrink:0, fontFamily:"Syne,sans-serif" }}>{initials}</div>
);
const Btn = ({ children, onClick, variant="primary", small, disabled, style:ex={} }) => {
  const base = { cursor:disabled?"not-allowed":"pointer", borderRadius:8, fontWeight:600, border:"none", transition:"all 0.2s", fontFamily:"DM Sans,sans-serif", opacity:disabled?0.5:1, ...ex };
  const v = {
    primary:{ background:G.accent, color:"#fff", padding:small?"6px 14px":"10px 20px", fontSize:small?13:14, boxShadow:`0 0 18px ${G.accent}44` },
    ghost:{ background:"transparent", color:G.text, padding:small?"6px 14px":"10px 20px", fontSize:small?13:14, border:`1px solid ${G.border}` },
    danger:{ background:G.danger+"22", color:G.danger, padding:small?"6px 14px":"10px 20px", fontSize:small?13:14, border:`1px solid ${G.danger}44` },
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...v[variant]}}>{children}</button>;
};
const Inp = ({ label, ...p }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
    {label && <label style={{ fontSize:12, color:G.muted, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</label>}
    <input {...p} style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"10px 14px", color:G.text, fontSize:14, outline:"none", width:"100%", ...p.style }} />
  </div>
);
const Sel = ({ label, children, ...p }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
    {label && <label style={{ fontSize:12, color:G.muted, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</label>}
    <select {...p} style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"10px 14px", color:G.text, fontSize:14, outline:"none", width:"100%", ...p.style }}>{children}</select>
  </div>
);
const Modal = ({ title, onClose, children }) => (
  <div style={{ position:"fixed", inset:0, background:"#00000088", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} className="fade-up" style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:16, width:"100%", maxWidth:480, padding:28, maxHeight:"90vh", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h3 className="syne" style={{ fontSize:18, fontWeight:700 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"none", border:"none", color:G.muted, cursor:"pointer", fontSize:20 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);
const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:14, padding:20, cursor:onClick?"pointer":"default", transition:"border-color 0.2s,transform 0.2s", ...style }}
    onMouseEnter={e=>{ if(onClick){e.currentTarget.style.borderColor=G.accent+"88";e.currentTarget.style.transform="translateY(-2px)";}}}
    onMouseLeave={e=>{ e.currentTarget.style.borderColor=G.border;e.currentTarget.style.transform="translateY(0)"; }}>
    {children}
  </div>
);
const Loader = () => <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60 }}><div style={{ width:32, height:32, border:`3px solid ${G.border}`, borderTopColor:G.accent, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"Member" });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      const data = mode==="login" ? await api.login({email:form.email,password:form.password}) : await api.signup(form);
      localStorage.setItem("tf_token", data.token);
      onLogin(data.user);
    } catch(e){ setErr(e.message); } finally { setLoading(false); }
  };
  return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", width:400, height:400, background:G.accent, borderRadius:"50%", filter:"blur(120px)", opacity:0.08, top:-100, left:-100, pointerEvents:"none" }} />
      <div className="fade-up" style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:40, height:40, background:`linear-gradient(135deg,${G.accent},#818cf8)`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{fontSize:20}}>⚡</span></div>
            <span className="syne" style={{ fontSize:22, fontWeight:800 }}>TaskForge</span>
          </div>
          <p style={{ color:G.muted, fontSize:14 }}>Team collaboration, reimagined.</p>
        </div>
        <Card>
          <div style={{ display:"flex", gap:8, marginBottom:24, background:G.surface, borderRadius:10, padding:4 }}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{ flex:1, padding:"8px 0", borderRadius:7, border:"none", cursor:"pointer", background:mode===m?G.accent:"transparent", color:mode===m?"#fff":G.muted, fontWeight:600, fontSize:14, transition:"all 0.2s", fontFamily:"DM Sans,sans-serif" }}>
                {m==="login"?"Sign In":"Sign Up"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="signup" && <Inp label="Full Name" value={form.name} onChange={set("name")} placeholder="Alex Rivera" />}
            <Inp label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            <Inp label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
            {mode==="signup" && <Sel label="Role" value={form.role} onChange={set("role")}><option>Member</option><option>Admin</option></Sel>}
            {err && <p style={{ color:G.danger, fontSize:13 }}>{err}</p>}
            <Btn onClick={submit} disabled={loading}>{loading?"Please wait…":mode==="login"?"Sign In":"Create Account"}</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"projects",icon:"⬡",label:"Projects"},{id:"tasks",icon:"◻",label:"Tasks"},{id:"team",icon:"◉",label:"Team"}];
function Sidebar({ page, setPage }) {
  const { currentUser, logout } = useApp();
  return (
    <div style={{ width:220, background:G.surface, borderRight:`1px solid ${G.border}`, display:"flex", flexDirection:"column", padding:"24px 16px", flexShrink:0, height:"100vh", position:"sticky", top:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:36, paddingLeft:4 }}>
        <div style={{ width:32, height:32, background:`linear-gradient(135deg,${G.accent},#818cf8)`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
        <span className="syne" style={{ fontSize:17, fontWeight:800 }}>TaskForge</span>
      </div>
      <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:"none", cursor:"pointer", background:page===n.id?G.accent+"22":"transparent", color:page===n.id?G.accent2:G.muted, fontWeight:page===n.id?600:400, fontSize:14, textAlign:"left", width:"100%", transition:"all 0.15s", fontFamily:"DM Sans,sans-serif" }}>
            <span style={{fontSize:16}}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:16, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Avatar initials={currentUser.avatar} size={34} />
          <div style={{minWidth:0}}>
            <div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser.name}</div>
            <div style={{ fontSize:11, color:G.muted }}>{currentUser.role}</div>
          </div>
        </div>
        <button onClick={logout} style={{ background:"none", border:`1px solid ${G.border}`, borderRadius:8, color:G.muted, fontSize:13, padding:"7px 12px", cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>Sign out</button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ setPage }) {
  const { tasks, projects, currentUser } = useApp();
  const overdue = tasks.filter(t=>isOverdue(t.dueDate,t.status));
  const stats = [
    { label:"Total Tasks", value:tasks.length, icon:"◻", color:G.accent },
    { label:"In Progress", value:tasks.filter(t=>t.status==="In Progress").length, icon:"◈", color:G.warning },
    { label:"Completed",   value:tasks.filter(t=>t.status==="Done").length, icon:"✓", color:G.success },
    { label:"Overdue",     value:overdue.length, icon:"!", color:G.danger },
  ];
  const recent = [...tasks].slice(0,5);
  return (
    <div className="fade-up" style={{ padding:"32px 28px", display:"flex", flexDirection:"column", gap:28 }}>
      <div>
        <h1 className="syne" style={{ fontSize:26, fontWeight:800, marginBottom:4 }}>Good day, {currentUser.name.split(" ")[0]} 👋</h1>
        <p style={{ color:G.muted, fontSize:14 }}>Here's what's happening across your projects.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {stats.map(s=>(
          <Card key={s.label} style={{padding:20}}>
            <div style={{ width:38, height:38, background:s.color+"22", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:s.color, fontSize:18, marginBottom:16 }}>{s.icon}</div>
            <div className="syne" style={{ fontSize:30, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:G.muted, marginTop:4 }}>{s.label}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 className="syne" style={{ fontSize:15, fontWeight:700 }}>Recent Tasks</h3>
            <Btn small variant="ghost" onClick={()=>setPage("tasks")}>View all</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {recent.map(t=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:G.surface, borderRadius:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:statusColor[t.status], flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ fontSize:11, color:G.muted }}>{t.Project?.name}</div>
                </div>
                <Badge label={t.status} color={statusColor[t.status]} />
              </div>
            ))}
            {recent.length===0 && <p style={{color:G.muted,fontSize:13,textAlign:"center",padding:20}}>No tasks yet.</p>}
          </div>
        </Card>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <h3 className="syne" style={{ fontSize:15, fontWeight:700 }}>Projects</h3>
            <Btn small variant="ghost" onClick={()=>setPage("projects")}>View all</Btn>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {projects.map(p=>{
              const pt=tasks.filter(t=>t.projectId===p.id||t.ProjectId===p.id);
              const pd=pt.filter(t=>t.status==="Done").length;
              const pct=pt.length?Math.round((pd/pt.length)*100):0;
              return (
                <div key={p.id} style={{ padding:"12px 14px", background:G.surface, borderRadius:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:p.color }} />
                      <span style={{ fontSize:13, fontWeight:600 }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize:12, color:G.muted }}>{pd}/{pt.length}</span>
                  </div>
                  <div style={{ background:G.border, borderRadius:99, height:4, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:p.color, borderRadius:99, transition:"width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
            {projects.length===0 && <p style={{color:G.muted,fontSize:13,textAlign:"center",padding:20}}>No projects yet.</p>}
          </div>
        </Card>
      </div>
      {overdue.length>0 && (
        <Card style={{ borderColor:G.danger+"44" }}>
          <h3 className="syne" style={{ fontSize:15, fontWeight:700, color:G.danger, marginBottom:16 }}>⚠ Overdue Tasks ({overdue.length})</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {overdue.map(t=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:G.danger+"0d", borderRadius:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{t.title}</div>
                  <div style={{ fontSize:11, color:G.muted }}>Due {t.dueDate} · {t.Project?.name}</div>
                </div>
                <Badge label={t.priority} color={priorityColor[t.priority]} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────
function ProjectsPage() {
  const { projects, tasks, users, currentUser, reload } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", description:"", memberIds:[], color:"#6366f1" });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const COLORS=["#6366f1","#f59e0b","#ef4444","#22c55e","#06b6d4","#ec4899","#8b5cf6"];
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const submit = async () => {
    if (!form.name) return; setLoading(true);
    try { await api.createProject({...form, memberIds:[currentUser.id,...form.memberIds]}); await reload(); setShowModal(false); setForm({name:"",description:"",memberIds:[],color:"#6366f1"}); }
    catch(e){alert(e.message);} finally{setLoading(false);}
  };
  const del = async (id,e) => {
    e.stopPropagation();
    if(!window.confirm("Delete this project and all its tasks?"))return;
    try{await api.deleteProject(id);await reload();}catch(e){alert(e.message);}
  };
  return (
    <div className="fade-up" style={{ padding:"32px 28px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div><h1 className="syne" style={{ fontSize:24, fontWeight:800, marginBottom:2 }}>Projects</h1><p style={{ color:G.muted, fontSize:14 }}>{projects.length} active</p></div>
        {currentUser.role==="Admin" && <Btn onClick={()=>setShowModal(true)}>+ New Project</Btn>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
        {projects.map(p=>{
          const pt=tasks.filter(t=>t.projectId===p.id||t.ProjectId===p.id);
          const pct=pt.length?Math.round((pt.filter(t=>t.status==="Done").length/pt.length)*100):0;
          const members=p.members||[];
          return (
            <Card key={p.id} onClick={()=>setSelected(p)} style={{padding:22}}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:p.color+"22", border:`2px solid ${p.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⬡</div>
                {currentUser.role==="Admin" && <button onClick={e=>del(p.id,e)} style={{ background:"none", border:"none", color:G.muted, cursor:"pointer", fontSize:18 }}>×</button>}
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{p.name}</h3>
              <p style={{ fontSize:13, color:G.muted, marginBottom:16, lineHeight:1.5 }}>{p.description}</p>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:12, color:G.muted }}>{pt.filter(t=>t.status==="Done").length}/{pt.length} tasks</span>
                <span style={{ fontSize:12, fontWeight:600, color:p.color }}>{pct}%</span>
              </div>
              <div style={{ background:G.border, borderRadius:99, height:5, overflow:"hidden", marginBottom:14 }}>
                <div style={{ width:`${pct}%`, height:"100%", background:p.color, borderRadius:99 }} />
              </div>
              <div style={{ display:"flex" }}>
                {members.slice(0,4).map((m,i)=>(
                  <div key={m.id} style={{ marginLeft:i>0?-8:0, border:`2px solid ${G.card}`, borderRadius:"50%" }}>
                    <Avatar initials={m.avatar} color={p.color} size={28} />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      {showModal && (
        <Modal title="New Project" onClose={()=>setShowModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Inp label="Project Name" value={form.name} onChange={set("name")} placeholder="e.g. Website Redesign" />
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, color:G.muted, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase" }}>Description</label>
              <textarea value={form.description} onChange={set("description")} rows={3} placeholder="What is this project about?" style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"10px 14px", color:G.text, fontSize:14, outline:"none", resize:"vertical", fontFamily:"DM Sans,sans-serif" }} />
            </div>
            <div>
              <label style={{ fontSize:12, color:G.muted, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:8 }}>Color</label>
              <div style={{ display:"flex", gap:8 }}>
                {COLORS.map(c=><button key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{ width:28, height:28, borderRadius:"50%", background:c, border:form.color===c?"3px solid #fff":"3px solid transparent", cursor:"pointer" }} />)}
              </div>
            </div>
            <Sel label="Add Members" value="" onChange={e=>{ if(e.target.value&&!form.memberIds.includes(e.target.value))setForm(f=>({...f,memberIds:[...f.memberIds,e.target.value]})); }}>
              <option value="">Select member…</option>
              {users.filter(u=>u.id!==currentUser.id).map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </Sel>
            {form.memberIds.length>0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {form.memberIds.map(id=>{ const u=users.find(u=>u.id===id); return u?(<div key={id} style={{ display:"flex", alignItems:"center", gap:6, background:G.surface, border:`1px solid ${G.border}`, borderRadius:99, padding:"4px 10px 4px 6px" }}><Avatar initials={u.avatar} size={20} /><span style={{fontSize:12}}>{u.name}</span><button onClick={()=>setForm(f=>({...f,memberIds:f.memberIds.filter(i=>i!==id)}))} style={{ background:"none", border:"none", color:G.muted, cursor:"pointer", fontSize:14 }}>×</button></div>):null; })}
              </div>
            )}
            <div style={{ display:"flex", gap:10, marginTop:8 }}>
              <Btn onClick={submit} disabled={loading}>{loading?"Creating…":"Create Project"}</Btn>
              <Btn variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
      {selected && <ProjectDetail project={selected} onClose={()=>{setSelected(null);reload();}} />}
    </div>
  );
}

function ProjectDetail({ project:p, onClose }) {
  const { tasks, users, currentUser, reload } = useApp();
  const ptasks = tasks.filter(t=>t.projectId===p.id||t.ProjectId===p.id);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title:"", description:"", assigneeId:"", status:"Todo", priority:"Medium", dueDate:today() });
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const members = p.members || [];
  const canManage = currentUser.role==="Admin";

  const addTask = async () => {
    if(!form.title||!form.assigneeId)return;
    try{ await api.createTask({...form, projectId:p.id}); await reload(); setShowAdd(false); setForm({title:"",description:"",assigneeId:"",status:"Todo",priority:"Medium",dueDate:today()}); }
    catch(e){alert(e.message);}
  };
  const cycleStatus = async (t) => {
    const next = t.status==="Todo"?"In Progress":t.status==="In Progress"?"Done":"Todo";
    try{ await api.updateTask(t.id,{status:next}); await reload(); }catch(e){alert(e.message);}
  };
  const delTask = async (id) => {
    try{ await api.deleteTask(id); await reload(); }catch(e){alert(e.message);}
  };

  return (
    <Modal title={p.name} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <p style={{ color:G.muted, fontSize:13 }}>{p.description}</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Badge label={`${ptasks.length} tasks`} color={p.color} />
          <Badge label={`${ptasks.filter(t=>t.status==="Done").length} done`} color={G.success} />
        </div>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h4 style={{ fontSize:14, fontWeight:600 }}>Tasks</h4>
            {canManage && <Btn small onClick={()=>setShowAdd(s=>!s)}>+ Add Task</Btn>}
          </div>
          {showAdd && (
            <div style={{ background:G.surface, borderRadius:12, padding:16, marginBottom:14, display:"flex", flexDirection:"column", gap:12 }}>
              <Inp label="Title" value={form.title} onChange={set("title")} placeholder="Task title" />
              <Sel label="Assignee" value={form.assigneeId} onChange={set("assigneeId")}>
                <option value="">Select assignee…</option>
                {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </Sel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <Sel label="Priority" value={form.priority} onChange={set("priority")}>{["High","Medium","Low"].map(v=><option key={v}>{v}</option>)}</Sel>
                <Inp label="Due Date" type="date" value={form.dueDate} onChange={set("dueDate")} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn small onClick={addTask}>Add</Btn>
                <Btn small variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ptasks.map(t=>{
              const assignee=t.assignee||users.find(u=>u.id===t.assigneeId);
              return (
                <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:G.bg, borderRadius:10, border:`1px solid ${isOverdue(t.dueDate,t.status)?G.danger+"44":G.border}` }}>
                  <button onClick={()=>cycleStatus(t)} style={{ width:18, height:18, borderRadius:5, border:`2px solid ${statusColor[t.status]}`, background:t.status==="Done"?statusColor[t.status]:"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:11 }}>{t.status==="Done"?"✓":""}</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{ fontSize:13, fontWeight:500, textDecoration:t.status==="Done"?"line-through":"none", opacity:t.status==="Done"?0.6:1 }}>{t.title}</div>
                    <div style={{ fontSize:11, color:G.muted }}>Due {t.dueDate}</div>
                  </div>
                  {assignee && <Avatar initials={assignee.avatar} size={24} />}
                  <Badge label={t.priority} color={priorityColor[t.priority]} />
                  {canManage && <button onClick={()=>delTask(t.id)} style={{ background:"none", border:"none", color:G.muted, cursor:"pointer", fontSize:14 }}>×</button>}
                </div>
              );
            })}
            {ptasks.length===0 && <p style={{ color:G.muted, fontSize:13, textAlign:"center", padding:20 }}>No tasks yet.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
function TasksPage() {
  const { tasks, projects, users, currentUser, reload } = useApp();
  const [filter, setFilter] = useState({ status:"All", priority:"All" });
  let filtered = tasks;
  if(filter.status!=="All") filtered=filtered.filter(t=>t.status===filter.status);
  if(filter.priority!=="All") filtered=filtered.filter(t=>t.priority===filter.priority);
  const cycleStatus = async (t) => {
    const next=t.status==="Todo"?"In Progress":t.status==="In Progress"?"Done":"Todo";
    try{await api.updateTask(t.id,{status:next});await reload();}catch(e){alert(e.message);}
  };
  const FB = ({k,v}) => <button onClick={()=>setFilter(f=>({...f,[k]:v}))} style={{ padding:"6px 14px", borderRadius:99, border:`1px solid ${filter[k]===v?G.accent:G.border}`, background:filter[k]===v?G.accent+"22":"transparent", color:filter[k]===v?G.accent2:G.muted, fontSize:13, cursor:"pointer", fontFamily:"DM Sans,sans-serif" }}>{v}</button>;
  return (
    <div className="fade-up" style={{ padding:"32px 28px" }}>
      <div style={{ marginBottom:28 }}>
        <h1 className="syne" style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>{currentUser.role==="Admin"?"All Tasks":"My Tasks"}</h1>
        <p style={{ color:G.muted, fontSize:14 }}>{filtered.length} tasks</p>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {["All","Todo","In Progress","Done"].map(v=><FB key={v} k="status" v={v} />)}
        <div style={{ width:1, background:G.border, margin:"0 4px" }} />
        {["All","High","Medium","Low"].map(v=><FB key={v} k="priority" v={v} />)}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(t=>{
          const assignee=t.assignee||users.find(u=>u.id===t.assigneeId);
          const project=t.Project||projects.find(p=>p.id===t.projectId||p.id===t.ProjectId);
          return (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:G.card, border:`1px solid ${isOverdue(t.dueDate,t.status)?G.danger+"44":G.border}`, borderRadius:12 }}>
              <button onClick={()=>cycleStatus(t)} style={{ width:20, height:20, borderRadius:6, border:`2px solid ${statusColor[t.status]}`, background:t.status==="Done"?statusColor[t.status]:"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12 }}>{t.status==="Done"?"✓":""}</button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{ fontSize:14, fontWeight:600, textDecoration:t.status==="Done"?"line-through":"none", opacity:t.status==="Done"?0.6:1 }}>{t.title}</div>
                <div style={{ fontSize:12, color:G.muted, marginTop:2 }}>{project?.name} · Due {t.dueDate}{isOverdue(t.dueDate,t.status)?" ⚠":""}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
                <Badge label={t.status} color={statusColor[t.status]} />
                <Badge label={t.priority} color={priorityColor[t.priority]} />
                {assignee && <Avatar initials={assignee.avatar} size={28} />}
              </div>
            </div>
          );
        })}
        {filtered.length===0 && <div style={{ textAlign:"center", padding:60, color:G.muted }}>No tasks match the filter.</div>}
      </div>
    </div>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────
function TeamPage() {
  const { users, tasks, currentUser, reload } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"Member" });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const submit = async () => {
    setErr(""); if(!form.name||!form.email||!form.password)return setErr("All fields required.");
    setLoading(true);
    try{ await api.inviteUser(form); await reload(); setForm({name:"",email:"",password:"",role:"Member"}); setShowModal(false); }
    catch(e){setErr(e.message);} finally{setLoading(false);}
  };
  return (
    <div className="fade-up" style={{ padding:"32px 28px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div><h1 className="syne" style={{ fontSize:24, fontWeight:800, marginBottom:2 }}>Team</h1><p style={{ color:G.muted, fontSize:14 }}>{users.length} members</p></div>
        {currentUser.role==="Admin" && <Btn onClick={()=>setShowModal(true)}>+ Invite Member</Btn>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {users.map(u=>{
          const ut=tasks.filter(t=>t.assigneeId===u.id||(t.assignee&&t.assignee.id===u.id));
          return (
            <Card key={u.id} style={{padding:22}}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                <Avatar initials={u.avatar} color={u.role==="Admin"?G.accent:G.warning} size={44} />
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>{u.name}{u.id===currentUser.id&&<span style={{color:G.muted,fontSize:11,marginLeft:6}}>(you)</span>}</div>
                  <div style={{ fontSize:13, color:G.muted }}>{u.email}</div>
                </div>
              </div>
              <Badge label={u.role} color={u.role==="Admin"?G.accent:G.warning} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center", marginTop:14 }}>
                {[["Total",ut.length,G.text],["Done",ut.filter(t=>t.status==="Done").length,G.success],["Active",ut.filter(t=>t.status!=="Done").length,G.accent]].map(([l,v,c])=>(
                  <div key={l} style={{ background:G.surface, borderRadius:8, padding:"10px 6px" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:c, fontFamily:"Syne,sans-serif" }}>{v}</div>
                    <div style={{ fontSize:11, color:G.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      {showModal && (
        <Modal title="Invite Member" onClose={()=>setShowModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Inp label="Full Name" value={form.name} onChange={set("name")} placeholder="Jane Doe" />
            <Inp label="Email" type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com" />
            <Inp label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
            <Sel label="Role" value={form.role} onChange={set("role")}><option>Member</option><option>Admin</option></Sel>
            {err && <p style={{ color:G.danger, fontSize:13 }}>{err}</p>}
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={submit} disabled={loading}>{loading?"Adding…":"Add Member"}</Btn>
              <Btn variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const t = localStorage.getItem("tf_token");
    if(!t) return null;
    try { return JSON.parse(atob(t.split(".")[1])); } catch { return null; }
  });
  const [page, setPage] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);

  const reload = async () => {
    if(!currentUser) return;
    setLoading(true);
    try {
      const [p,t,u] = await Promise.all([api.getProjects(), api.getTasks(), api.getUsers()]);
      setProjects(p); setTasks(t); setUsers(u);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if(currentUser) reload(); }, [currentUser]);

  const logout = () => { localStorage.removeItem("tf_token"); setCurrentUser(null); };

  const ctx = { currentUser, projects, tasks, users, reload, logout };

  if(!currentUser) return (<><style>{css}</style><AuthScreen onLogin={u=>setCurrentUser(u)} /></>);

  const pages = { dashboard:<Dashboard setPage={setPage}/>, projects:<ProjectsPage/>, tasks:<TasksPage/>, team:<TeamPage/> };

  return (
    <AppContext.Provider value={ctx}>
      <style>{css}</style>
      <div style={{ display:"flex", minHeight:"100vh", background:G.bg }}>
        <Sidebar page={page} setPage={setPage} />
        <main style={{ flex:1, overflowY:"auto", minWidth:0 }}>
          {loading ? <Loader /> : pages[page]}
        </main>
      </div>
    </AppContext.Provider>
  );
}
