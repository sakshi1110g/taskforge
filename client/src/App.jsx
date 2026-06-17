import { useState, useEffect, createContext, useContext } from "react";
import { api } from "./api";

const AppContext   = createContext(null);
const ThemeContext = createContext(null);
const useApp   = () => useContext(AppContext);
const useTheme = () => useContext(ThemeContext);

const DARK  = { bg:"#0a0f1e",surface:"#111827",card:"#1a2236",border:"#1e2d45",accent:"#6366f1",accent2:"#818cf8",text:"#e2e8f0",muted:"#64748b",danger:"#ef4444",success:"#22c55e",warning:"#f59e0b",inputBg:"#111827",shadow:"0 4px 24px rgba(0,0,0,0.4)",isDark:true };
const LIGHT = { bg:"#f1f5f9",surface:"#ffffff",card:"#ffffff",border:"#e2e8f0",accent:"#6366f1",accent2:"#4f46e5",text:"#0f172a",muted:"#64748b",danger:"#ef4444",success:"#16a34a",warning:"#d97706",inputBg:"#f8fafc",shadow:"0 2px 12px rgba(0,0,0,0.07)",isDark:false };

const SC = { "Todo":"#64748b","In Progress":"#6366f1","Done":"#22c55e" };
const PC = { "High":"#ef4444","Medium":"#f59e0b","Low":"#3b82f6" };
const tod  = () => new Date().toISOString().split("T")[0];
const over = (d,s) => s!=="Done" && d && d < tod();
const sid  = x => x ? (x.id||x._id||"").toString() : "";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html { -webkit-text-size-adjust:100%; }
  body { font-family:'DM Sans',sans-serif; transition:background .3s,color .3s; -webkit-font-smoothing:antialiased; }
  input,select,textarea,button { font-family:'DM Sans',sans-serif; }
  .syne { font-family:'Syne',sans-serif; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-thumb { background:#334155; border-radius:4px; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }
  @keyframes slideIn{ from{transform:translateX(-100%)} to{transform:translateX(0)} }
  .fade-up { animation:fadeUp .3s ease forwards; }
  .spin    { animation:spin .7s linear infinite; }

  /* ── Layout ── */
  .app-shell    { display:flex; min-height:100vh; }
  .desktop-sb   { display:flex; flex-direction:column; }
  .mob-topbar   { display:none; position:sticky; top:0; z-index:100; }
  .mob-bottomnav{ display:none; position:fixed; bottom:0; left:0; right:0; z-index:100; padding-bottom:env(safe-area-inset-bottom); }
  .bd           { display:none; position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:149; }
  .sb-drawer    { display:flex; flex-direction:column; }

  /* ── Responsive grids ── */
  .sgrid  { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
  .twocol { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .pgrid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:16px; }
  .tgrid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
  .page   { padding:28px 24px; }
  .fbar   { display:flex; gap:8px; flex-wrap:wrap; }

  @media (max-width:860px) {
    .twocol { grid-template-columns:1fr; }
  }

  @media (max-width:640px) {
    .desktop-sb    { display:none !important; }
    .mob-topbar    { display:flex; align-items:center; justify-content:space-between; }
    .mob-bottomnav { display:flex; align-items:center; justify-content:space-around; }
    .sb-drawer     { position:fixed; top:0; left:0; height:100%; width:240px; z-index:150;
                     transform:translateX(-100%); transition:transform .25s ease; }
    .sb-drawer.open{ transform:translateX(0); animation:slideIn .25s ease; }
    .bd.show       { display:block; }
    .sgrid  { grid-template-columns:repeat(2,1fr); }
    .pgrid  { grid-template-columns:1fr; }
    .tgrid  { grid-template-columns:1fr; }
    .page   { padding:16px 14px; padding-bottom:90px; }
    .fbar   { flex-wrap:nowrap; overflow-x:auto; padding-bottom:4px; }
    .fbar::-webkit-scrollbar{ display:none; }
    .twocol-form { grid-template-columns:1fr !important; }
    .modal-wrap  { align-items:flex-end !important; padding:0 !important; }
    .modal-inner { border-radius:18px 18px 0 0 !important; max-height:92vh !important; }
  }
`;

// ── Atoms ─────────────────────────────────────────────────────────────────────
const Badge = ({label,color}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>{label}</span>
);
const Av = ({initials,color="#6366f1",size=32}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:color+"33",border:`2px solid ${color}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:Math.max(10,size*.34),fontWeight:700,color,flexShrink:0,fontFamily:"Syne,sans-serif",userSelect:"none"}}>{initials||"?"}</div>
);
const Toggle = ({dark,toggle}) => (
  <button onClick={toggle} title={dark?"Light mode":"Dark mode"} style={{background:"none",border:"none",cursor:"pointer",fontSize:19,padding:"5px 7px",borderRadius:8,lineHeight:1,transition:"transform .2s"}} onMouseEnter={e=>e.target.style.transform="rotate(20deg)"} onMouseLeave={e=>e.target.style.transform="rotate(0)"}>
    {dark?"☀️":"🌙"}
  </button>
);
const Loader = () => {
  const G=useTheme();
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:220}}><div className="spin" style={{width:32,height:32,border:`3px solid ${G.border}`,borderTopColor:G.accent,borderRadius:"50%"}}/></div>;
};

function Btn({children,onClick,variant="primary",small,disabled,full,style:ex={}}) {
  const G=useTheme();
  const S={
    primary:{background:G.accent,color:"#fff",border:"none",boxShadow:`0 0 14px ${G.accent}44`},
    ghost:  {background:"transparent",color:G.text,border:`1px solid ${G.border}`},
    danger: {background:G.danger+"18",color:G.danger,border:`1px solid ${G.danger}44`},
  };
  return (
    <button onClick={disabled?undefined:onClick}
      style={{...S[variant],padding:small?"7px 14px":"10px 20px",fontSize:small?13:14,fontWeight:600,borderRadius:9,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"opacity .15s,transform .1s",width:full?"100%":"auto",...ex}}
      onMouseDown={e=>{if(!disabled)e.currentTarget.style.transform="scale(.97)"}}
      onMouseUp={e=>{e.currentTarget.style.transform="scale(1)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)"}}>
      {children}
    </button>
  );
}
function Inp({label,...p}) {
  const G=useTheme();
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:11,color:G.muted,fontWeight:600,letterSpacing:".07em",textTransform:"uppercase"}}>{label}</label>}
      <input {...p} style={{background:G.inputBg,border:`1.5px solid ${G.border}`,borderRadius:9,padding:"10px 13px",color:G.text,fontSize:14,outline:"none",width:"100%",transition:"border-color .2s",...p.style}}
        onFocus={e=>e.target.style.borderColor=G.accent} onBlur={e=>e.target.style.borderColor=G.border}/>
    </div>
  );
}
function Sel({label,children,...p}) {
  const G=useTheme();
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:11,color:G.muted,fontWeight:600,letterSpacing:".07em",textTransform:"uppercase"}}>{label}</label>}
      <select {...p} style={{background:G.inputBg,border:`1.5px solid ${G.border}`,borderRadius:9,padding:"10px 13px",color:G.text,fontSize:14,outline:"none",width:"100%",...p.style}}>{children}</select>
    </div>
  );
}
function Modal({title,onClose,children}) {
  const G=useTheme();
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow=""}},[]);
  return (
    <div className="modal-wrap" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div className="modal-inner fade-up" onClick={e=>e.stopPropagation()} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,width:"100%",maxWidth:500,padding:24,maxHeight:"90vh",overflowY:"auto",boxShadow:G.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 className="syne" style={{fontSize:17,fontWeight:800,color:G.text}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:24,lineHeight:1,padding:"2px 6px"}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Card({children,style={},onClick}) {
  const G=useTheme();
  return (
    <div onClick={onClick} style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:14,padding:18,cursor:onClick?"pointer":"default",transition:"border-color .2s,transform .2s,box-shadow .2s",boxShadow:G.shadow,...style}}
      onMouseEnter={e=>{if(onClick){e.currentTarget.style.borderColor=G.accent+"88";e.currentTarget.style.transform="translateY(-2px)";}}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.transform="translateY(0)";}}>
      {children}
    </div>
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function AuthScreen({onLogin,dark,toggleDark}) {
  const G=dark?DARK:LIGHT;
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:"",role:"Member"});
  const [err,setErr]=useState(""); const [load,setLoad]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const submit=async()=>{
    setErr("");setLoad(true);
    try{const d=mode==="login"?await api.login({email:form.email,password:form.password}):await api.signup(form);localStorage.setItem("tf_token",d.token);onLogin(d.user);}
    catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  return (
    <ThemeContext.Provider value={G}>
    <style>{css}</style>
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden",transition:"background .3s"}}>
      <div style={{position:"absolute",width:400,height:400,background:G.accent,borderRadius:"50%",filter:"blur(120px)",opacity:.07,top:-100,left:-100,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:16,right:16}}><Toggle dark={dark} toggle={toggleDark}/></div>
      <div className="fade-up" style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:38,height:38,background:`linear-gradient(135deg,${G.accent},#818cf8)`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚡</div>
            <span className="syne" style={{fontSize:22,fontWeight:800,color:G.text}}>TaskForge</span>
          </div>
          <p style={{color:G.muted,fontSize:13}}>Team collaboration, reimagined.</p>
        </div>
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:16,padding:24,boxShadow:G.shadow}}>
          <div style={{display:"flex",gap:6,marginBottom:20,background:G.surface,borderRadius:10,padding:4}}>
            {["login","signup"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"8px 0",borderRadius:7,border:"none",cursor:"pointer",background:mode===m?G.accent:"transparent",color:mode===m?"#fff":G.muted,fontWeight:600,fontSize:13,transition:"all .2s"}}>
                {m==="login"?"Sign In":"Sign Up"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            {mode==="signup"&&<Inp label="Full Name" value={form.name} onChange={set("name")} placeholder="Alex Rivera"/>}
            <Inp label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com"/>
            <Inp label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••"/>
            {mode==="signup"&&<Sel label="Role" value={form.role} onChange={set("role")}><option>Member</option><option>Admin</option></Sel>}
            {err&&<p style={{color:G.danger,fontSize:13,background:G.danger+"11",padding:"8px 12px",borderRadius:8}}>{err}</p>}
            <button onClick={submit} disabled={load} style={{background:G.accent,color:"#fff",border:"none",borderRadius:9,padding:"12px 0",fontWeight:700,fontSize:15,cursor:load?"not-allowed":"pointer",opacity:load?.7:1,boxShadow:`0 0 20px ${G.accent}44`,width:"100%",transition:"opacity .2s"}}>
              {load?"Please wait…":mode==="login"?"Sign In →":"Create Account →"}
            </button>
          </div>
          {mode==="login"&&<div style={{marginTop:14,padding:12,background:G.surface,borderRadius:10,fontSize:12,color:G.muted,lineHeight:1.9}}><strong style={{color:G.text}}>Demo:</strong> admin@demo.com / admin123</div>}
        </div>
      </div>
    </div>
    </ThemeContext.Provider>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV=[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"projects",icon:"⬡",label:"Projects"},{id:"tasks",icon:"◻",label:"Tasks"},{id:"team",icon:"◉",label:"Team"}];

function Sidebar({page,setPage,dark,toggleDark,open,onClose}) {
  const G=useTheme(); const {currentUser,logout}=useApp();
  return (
    <>
      <div className={`bd${open?" show":""}`} onClick={onClose}/>
      <div className={`sb-drawer desktop-sb${open?" open":""}`} style={{width:220,background:G.surface,borderRight:`1px solid ${G.border}`,padding:"22px 14px",transition:"background .3s"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,paddingLeft:4}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,background:`linear-gradient(135deg,${G.accent},#818cf8)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⚡</div>
            <span className="syne" style={{fontSize:16,fontWeight:800,color:G.text}}>TaskForge</span>
          </div>
          <Toggle dark={dark} toggle={toggleDark}/>
        </div>
        <nav style={{flex:1,display:"flex",flexDirection:"column",gap:3}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>{setPage(n.id);onClose();}} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 13px",borderRadius:10,border:"none",cursor:"pointer",background:page===n.id?G.accent+"22":"transparent",color:page===n.id?G.accent:G.muted,fontWeight:page===n.id?600:400,fontSize:14,textAlign:"left",width:"100%",transition:"all .15s"}}>
              <span style={{fontSize:15}}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{borderTop:`1px solid ${G.border}`,paddingTop:14,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Av initials={currentUser.avatar} size={34}/>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:G.text}}>{currentUser.name}</div>
              <div style={{fontSize:11,color:G.muted}}>{currentUser.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{background:"none",border:`1px solid ${G.border}`,borderRadius:8,color:G.muted,fontSize:13,padding:"7px 12px",cursor:"pointer",transition:"all .2s"}}>Sign out</button>
        </div>
      </div>
    </>
  );
}

function MobTopbar({onMenu,dark,toggleDark}) {
  const G=useTheme();
  return (
    <div className="mob-topbar" style={{background:G.surface,borderBottom:`1px solid ${G.border}`,padding:"12px 16px",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onMenu} style={{background:"none",border:"none",cursor:"pointer",color:G.text,fontSize:22,lineHeight:1,padding:4}}>☰</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,background:`linear-gradient(135deg,${G.accent},#818cf8)`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>⚡</div>
          <span className="syne" style={{fontSize:16,fontWeight:800,color:G.text}}>TaskForge</span>
        </div>
      </div>
      <Toggle dark={dark} toggle={toggleDark}/>
    </div>
  );
}

function MobBottomNav({page,setPage}) {
  const G=useTheme();
  return (
    <div className="mob-bottomnav" style={{background:G.surface,borderTop:`1px solid ${G.border}`,padding:"6px 0"}}>
      {NAV.map(n=>(
        <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 14px",color:page===n.id?G.accent:G.muted}}>
          <span style={{fontSize:19}}>{n.icon}</span>
          <span style={{fontSize:10,fontWeight:600}}>{n.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({setPage,dark,toggleDark}) {
  const G=useTheme(); const {tasks,projects,currentUser}=useApp();
  const overdue=tasks.filter(t=>over(t.dueDate,t.status));
  const stats=[
    {label:"Total Tasks",value:tasks.length,icon:"◻",color:G.accent},
    {label:"In Progress",value:tasks.filter(t=>t.status==="In Progress").length,icon:"◈",color:G.warning},
    {label:"Completed",value:tasks.filter(t=>t.status==="Done").length,icon:"✓",color:G.success},
    {label:"Overdue",value:overdue.length,icon:"!",color:G.danger},
  ];
  return (
    <div className="fade-up page" style={{display:"flex",flexDirection:"column",gap:20}}>

      <div style={{padding:"0 0"}}>
        <h1 className="syne" style={{fontSize:22,fontWeight:800,marginBottom:3,color:G.text}}>Good day, {currentUser.name.split(" ")[0]} 👋</h1>
        <p style={{color:G.muted,fontSize:13}}>Here's what's happening across your projects.</p>
      </div>
      <div className="sgrid">
        {stats.map(s=>(
          <Card key={s.label} style={{padding:16}}>
            <div style={{width:34,height:34,background:s.color+"18",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:s.color,fontSize:16,marginBottom:10}}>{s.icon}</div>
            <div className="syne" style={{fontSize:26,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,color:G.muted,marginTop:3}}>{s.label}</div>
          </Card>
        ))}
      </div>
      <div className="twocol">
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 className="syne" style={{fontSize:14,fontWeight:700,color:G.text}}>Recent Tasks</h3>
            <Btn small variant="ghost" onClick={()=>setPage("tasks")}>View all</Btn>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {tasks.slice(0,5).map(t=>(
              <div key={sid(t)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",background:G.surface,borderRadius:9}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:SC[t.status],flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:G.text}}>{t.title}</div>
                  <div style={{fontSize:11,color:G.muted}}>{t.Project?.name}</div>
                </div>
                <Badge label={t.status} color={SC[t.status]}/>
              </div>
            ))}
            {tasks.length===0&&<p style={{color:G.muted,fontSize:13,textAlign:"center",padding:16}}>No tasks yet.</p>}
          </div>
        </Card>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <h3 className="syne" style={{fontSize:14,fontWeight:700,color:G.text}}>Projects</h3>
            <Btn small variant="ghost" onClick={()=>setPage("projects")}>View all</Btn>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {projects.map(p=>{
              const pt=tasks.filter(t=>String(t.projectId)===String(p.id||p._id));
              const pct=pt.length?Math.round(pt.filter(t=>t.status==="Done").length/pt.length*100):0;
              return (
                <div key={sid(p)} style={{padding:"10px 12px",background:G.surface,borderRadius:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:9,height:9,borderRadius:3,background:p.color,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:600,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                    </div>
                    <span style={{fontSize:11,color:G.muted,flexShrink:0}}>{pt.filter(t=>t.status==="Done").length}/{pt.length}</span>
                  </div>
                  <div style={{background:G.border,borderRadius:99,height:4,overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:p.color,borderRadius:99,transition:"width .6s"}}/>
                  </div>
                </div>
              );
            })}
            {projects.length===0&&<p style={{color:G.muted,fontSize:13,textAlign:"center",padding:16}}>No projects yet.</p>}
          </div>
        </Card>
      </div>
      {overdue.length>0&&(
        <Card style={{borderColor:G.danger+"55"}}>
          <h3 className="syne" style={{fontSize:14,fontWeight:700,color:G.danger,marginBottom:10}}>⚠ Overdue ({overdue.length})</h3>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {overdue.map(t=>(
              <div key={sid(t)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",background:G.danger+"0d",borderRadius:9}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                  <div style={{fontSize:11,color:G.muted}}>Due {t.dueDate} · {t.Project?.name}</div>
                </div>
                <Badge label={t.priority} color={PC[t.priority]}/>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────
function ProjectsPage({dark,toggleDark}) {
  const G=useTheme(); const {projects,tasks,users,currentUser,reload}=useApp();
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({name:"",description:"",memberIds:[],color:"#6366f1"});
  const [sel,setSel]=useState(null); const [load,setLoad]=useState(false); const [err,setErr]=useState("");
  const COLORS=["#6366f1","#f59e0b","#ef4444","#22c55e","#06b6d4","#ec4899","#8b5cf6"];
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const submit=async()=>{
    if(!form.name){setErr("Project name is required.");return;}
    setLoad(true);setErr("");
    try{await api.createProject({name:form.name,description:form.description||"",color:form.color,memberIds:form.memberIds||[]});await reload();setShow(false);setForm({name:"",description:"",memberIds:[],color:"#6366f1"});}
    catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  const del=async(id,e)=>{e.stopPropagation();if(!window.confirm("Delete project and all its tasks?"))return;try{await api.deleteProject(id);await reload();}catch(e){alert(e.message);}};
  return (
    <div className="fade-up page">

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h1 className="syne" style={{fontSize:22,fontWeight:800,marginBottom:2,color:G.text}}>Projects</h1>
          <p style={{color:G.muted,fontSize:13}}>{projects.length} active</p>
        </div>
        {currentUser.role==="Admin"&&<Btn onClick={()=>setShow(true)}>+ New</Btn>}
      </div>
      <div className="pgrid">
        {projects.map(p=>{
          const pid=sid(p);
          const pt=tasks.filter(t=>String(t.projectId)===pid);
          const pct=pt.length?Math.round(pt.filter(t=>t.status==="Done").length/pt.length*100):0;
          const members=p.members||[];
          return (
            <Card key={pid} onClick={()=>setSel(p)} style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:p.color+"22",border:`2px solid ${p.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>⬡</div>
                {currentUser.role==="Admin"&&<button onClick={e=>del(pid,e)} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:18,padding:4}}>×</button>}
              </div>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:5,color:G.text}}>{p.name}</h3>
              <p style={{fontSize:12,color:G.muted,marginBottom:12,lineHeight:1.5}}>{p.description}</p>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:11,color:G.muted}}>{pt.filter(t=>t.status==="Done").length}/{pt.length} tasks</span>
                <span style={{fontSize:11,fontWeight:700,color:p.color}}>{pct}%</span>
              </div>
              <div style={{background:G.border,borderRadius:99,height:4,overflow:"hidden",marginBottom:12}}>
                <div style={{width:`${pct}%`,height:"100%",background:p.color,borderRadius:99,transition:"width .6s"}}/>
              </div>
              <div style={{display:"flex"}}>
                {members.slice(0,4).map((m,i)=>(
                  <div key={sid(m)} style={{marginLeft:i>0?-8:0,border:`2px solid ${G.card}`,borderRadius:"50%"}}>
                    <Av initials={m.avatar} color={p.color} size={26}/>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        {projects.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:50,color:G.muted}}>
            <div style={{fontSize:36,marginBottom:10}}>⬡</div>
            <p style={{fontSize:14}}>{currentUser.role==="Admin"?"Click \"+ New\" to create your first project.":"No projects assigned yet."}</p>
          </div>
        )}
      </div>
      {show&&(
        <Modal title="New Project" onClose={()=>setShow(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Project Name" value={form.name} onChange={set("name")} placeholder="e.g. Website Redesign"/>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,color:G.muted,fontWeight:600,letterSpacing:".07em",textTransform:"uppercase"}}>Description</label>
              <textarea value={form.description} onChange={set("description")} rows={3} placeholder="What is this project about?" style={{background:G.inputBg,border:`1.5px solid ${G.border}`,borderRadius:9,padding:"10px 13px",color:G.text,fontSize:14,outline:"none",resize:"vertical"}}/>
            </div>
            <div>
              <label style={{fontSize:11,color:G.muted,fontWeight:600,letterSpacing:".07em",textTransform:"uppercase",display:"block",marginBottom:8}}>Color</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {COLORS.map(c=><button key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer",boxShadow:form.color===c?`0 0 0 2px ${c}`:"none",transition:"all .15s"}}/>)}
              </div>
            </div>
            <Sel label="Add Members" value="" onChange={e=>{if(e.target.value&&!form.memberIds.includes(e.target.value))setForm(f=>({...f,memberIds:[...f.memberIds,e.target.value]}))}}>
              <option value="">Select member…</option>
              {users.filter(u=>sid(u)!==sid(currentUser)).map(u=><option key={sid(u)} value={sid(u)}>{u.name} ({u.role})</option>)}
            </Sel>
            {form.memberIds.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {form.memberIds.map(id=>{const u=users.find(u=>sid(u)===id);return u?(<div key={id} style={{display:"flex",alignItems:"center",gap:6,background:G.surface,border:`1px solid ${G.border}`,borderRadius:99,padding:"4px 10px 4px 6px"}}><Av initials={u.avatar} size={20}/><span style={{fontSize:12,color:G.text}}>{u.name}</span><button onClick={()=>setForm(f=>({...f,memberIds:f.memberIds.filter(i=>i!==id)}))} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:14}}>×</button></div>):null;})}
              </div>
            )}
            {err&&<p style={{color:G.danger,fontSize:13,background:G.danger+"11",padding:"8px 12px",borderRadius:8}}>❌ {err}</p>}
            <div style={{display:"flex",gap:10,marginTop:4}}>
              <Btn onClick={submit} disabled={load}>{load?"Creating…":"Create Project"}</Btn>
              <Btn variant="ghost" onClick={()=>setShow(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
      {sel&&<ProjectDetail project={sel} onClose={()=>{setSel(null);reload();}}/>}
    </div>
  );
}

function ProjectDetail({project:p,onClose}) {
  const G=useTheme(); const {tasks,users,currentUser,reload}=useApp();
  const pid=sid(p);
  const ptasks=tasks.filter(t=>String(t.projectId)===pid);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({title:"",assigneeId:"",status:"Todo",priority:"Medium",dueDate:tod()});
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const members=p.members||[];
  const canManage=currentUser.role==="Admin";
  const addTask=async()=>{if(!form.title||!form.assigneeId)return;try{await api.createTask({...form,projectId:pid});await reload();setShowAdd(false);setForm({title:"",assigneeId:"",status:"Todo",priority:"Medium",dueDate:tod()});}catch(e){alert(e.message);}};
  const cycle=async t=>{const next=t.status==="Todo"?"In Progress":t.status==="In Progress"?"Done":"Todo";try{await api.updateTask(sid(t),{status:next});await reload();}catch(e){alert(e.message);}};
  const del=async id=>{try{await api.deleteTask(id);await reload();}catch(e){alert(e.message);}};
  return (
    <Modal title={p.name} onClose={onClose}>
      <div style={{display:"flex",flexDirection:"column",gap:15}}>
        <p style={{color:G.muted,fontSize:13}}>{p.description}</p>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <Badge label={`${ptasks.length} tasks`} color={p.color}/>
          <Badge label={`${ptasks.filter(t=>t.status==="Done").length} done`} color={G.success}/>
          {ptasks.filter(t=>over(t.dueDate,t.status)).length>0&&<Badge label={`${ptasks.filter(t=>over(t.dueDate,t.status)).length} overdue`} color={G.danger}/>}
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{fontSize:14,fontWeight:600,color:G.text}}>Tasks</h4>
            {canManage&&<Btn small onClick={()=>setShowAdd(s=>!s)}>+ Add Task</Btn>}
          </div>
          {showAdd&&(
            <div style={{background:G.surface,borderRadius:12,padding:14,marginBottom:12,display:"flex",flexDirection:"column",gap:11}}>
              <Inp label="Title" value={form.title} onChange={set("title")} placeholder="Task title"/>
              <Sel label="Assignee" value={form.assigneeId} onChange={set("assigneeId")}>
                <option value="">Select assignee…</option>
                {members.map(m=><option key={sid(m)} value={sid(m)}>{m.name}</option>)}
              </Sel>
              <div className="twocol-form" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <Sel label="Priority" value={form.priority} onChange={set("priority")}>{["High","Medium","Low"].map(v=><option key={v}>{v}</option>)}</Sel>
                <Inp label="Due Date" type="date" value={form.dueDate} onChange={set("dueDate")}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn small onClick={addTask}>Add Task</Btn>
                <Btn small variant="ghost" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              </div>
            </div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ptasks.map(t=>{
              const tid=sid(t);
              const assignee=t.assignee||users.find(u=>String(sid(u))===String(t.assigneeId));
              return (
                <div key={tid} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",background:G.bg,borderRadius:10,border:`1px solid ${over(t.dueDate,t.status)?G.danger+"55":G.border}`}}>
                  <button onClick={()=>cycle(t)} style={{width:18,height:18,borderRadius:5,border:`2px solid ${SC[t.status]}`,background:t.status==="Done"?SC[t.status]:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11}}>{t.status==="Done"?"✓":""}</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,textDecoration:t.status==="Done"?"line-through":"none",opacity:t.status==="Done"?.6:1,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                    <div style={{fontSize:11,color:G.muted}}>Due {t.dueDate}{over(t.dueDate,t.status)?" ⚠":""}</div>
                  </div>
                  {assignee&&<Av initials={assignee.avatar} size={24}/>}
                  <Badge label={t.priority} color={PC[t.priority]}/>
                  {canManage&&<button onClick={()=>del(tid)} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:15,padding:2}}>×</button>}
                </div>
              );
            })}
            {ptasks.length===0&&<p style={{color:G.muted,fontSize:13,textAlign:"center",padding:18}}>No tasks yet.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
function TasksPage({dark,toggleDark}) {
  const G=useTheme(); const {tasks,projects,users,currentUser,reload}=useApp();
  const [filter,setFilter]=useState({status:"All",priority:"All"});
  let filtered=tasks;
  if(filter.status!=="All") filtered=filtered.filter(t=>t.status===filter.status);
  if(filter.priority!=="All") filtered=filtered.filter(t=>t.priority===filter.priority);
  const cycle=async t=>{const next=t.status==="Todo"?"In Progress":t.status==="In Progress"?"Done":"Todo";try{await api.updateTask(sid(t),{status:next});await reload();}catch(e){alert(e.message);}};
  const FB=({k,v})=>(<button onClick={()=>setFilter(f=>({...f,[k]:v}))} style={{padding:"6px 13px",borderRadius:99,border:`1px solid ${filter[k]===v?G.accent:G.border}`,background:filter[k]===v?G.accent+"22":"transparent",color:filter[k]===v?G.accent:G.muted,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontWeight:500,transition:"all .15s",flexShrink:0}}>{v}</button>);
  return (
    <div className="fade-up page">

      <div style={{marginBottom:18}}>
        <h1 className="syne" style={{fontSize:22,fontWeight:800,marginBottom:3,color:G.text}}>{currentUser.role==="Admin"?"All Tasks":"My Tasks"}</h1>
        <p style={{color:G.muted,fontSize:13}}>{filtered.length} tasks</p>
      </div>
      <div className="fbar" style={{marginBottom:16}}>
        {["All","Todo","In Progress","Done"].map(v=><FB key={v} k="status" v={v}/>)}
        <div style={{width:1,background:G.border,margin:"0 2px",flexShrink:0}}/>
        {["All","High","Medium","Low"].map(v=><FB key={v} k="priority" v={v}/>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.map(t=>{
          const assignee=t.assignee||users.find(u=>String(sid(u))===String(t.assigneeId));
          const project=t.Project||projects.find(p=>String(sid(p))===String(t.projectId));
          return (
            <div key={sid(t)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:G.card,border:`1px solid ${over(t.dueDate,t.status)?G.danger+"55":G.border}`,borderRadius:12,boxShadow:G.shadow}}>
              <button onClick={()=>cycle(t)} style={{width:20,height:20,borderRadius:6,border:`2px solid ${SC[t.status]}`,background:t.status==="Done"?SC[t.status]:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11}}>{t.status==="Done"?"✓":""}</button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,textDecoration:t.status==="Done"?"line-through":"none",opacity:t.status==="Done"?.6:1,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                <div style={{fontSize:11,color:G.muted,marginTop:2}}>{project?.name} · Due {t.dueDate}{over(t.dueDate,t.status)?" ⚠":""}</div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                <Badge label={t.status} color={SC[t.status]}/>
                <Badge label={t.priority} color={PC[t.priority]}/>
                {assignee&&<Av initials={assignee.avatar} size={26}/>}
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:50,color:G.muted,fontSize:14}}>No tasks match the filter.</div>}
      </div>
    </div>
  );
}

// ── Team ──────────────────────────────────────────────────────────────────────
function TeamPage({dark,toggleDark}) {
  const G=useTheme(); const {users,tasks,currentUser,reload}=useApp();
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"Member"});
  const [err,setErr]=useState(""); const [load,setLoad]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const submit=async()=>{
    setErr(""); if(!form.name||!form.email||!form.password)return setErr("All fields required.");
    setLoad(true);
    try{await api.inviteUser(form);await reload();setForm({name:"",email:"",password:"",role:"Member"});setShow(false);}
    catch(e){setErr(e.message);}finally{setLoad(false);}
  };
  return (
    <div className="fade-up page">

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h1 className="syne" style={{fontSize:22,fontWeight:800,marginBottom:2,color:G.text}}>Team</h1>
          <p style={{color:G.muted,fontSize:13}}>{users.length} members</p>
        </div>
        {currentUser.role==="Admin"&&<Btn onClick={()=>setShow(true)}>+ Invite</Btn>}
      </div>
      <div className="tgrid">
        {users.map(u=>{
          const uid=sid(u);
          const ut=tasks.filter(t=>String(t.assigneeId)===uid||(t.assignee&&String(sid(t.assignee))===uid));
          return (
            <Card key={uid} style={{padding:20}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <Av initials={u.avatar} color={u.role==="Admin"?G.accent:G.warning} size={42}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {u.name}{uid===sid(currentUser)&&<span style={{color:G.muted,fontSize:10,marginLeft:5}}>(you)</span>}
                  </div>
                  <div style={{fontSize:12,color:G.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.email}</div>
                </div>
              </div>
              <Badge label={u.role} color={u.role==="Admin"?G.accent:G.warning}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,textAlign:"center",marginTop:12}}>
                {[["Total",ut.length,G.accent],["Done",ut.filter(t=>t.status==="Done").length,G.success],["Active",ut.filter(t=>t.status!=="Done").length,G.warning]].map(([l,v,c])=>(
                  <div key={l} style={{background:G.surface,borderRadius:8,padding:"9px 4px"}}>
                    <div style={{fontSize:18,fontWeight:800,color:c,fontFamily:"Syne,sans-serif"}}>{v}</div>
                    <div style={{fontSize:10,color:G.muted}}>{l}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      {show&&(
        <Modal title="Invite Member" onClose={()=>setShow(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <Inp label="Full Name" value={form.name} onChange={set("name")} placeholder="Jane Doe"/>
            <Inp label="Email" type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com"/>
            <Inp label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••"/>
            <Sel label="Role" value={form.role} onChange={set("role")}><option>Member</option><option>Admin</option></Sel>
            {err&&<p style={{color:G.danger,fontSize:13,background:G.danger+"11",padding:"8px 12px",borderRadius:8}}>{err}</p>}
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={submit} disabled={load}>{load?"Adding…":"Add Member"}</Btn>
              <Btn variant="ghost" onClick={()=>setShow(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,setDark]=useState(()=>localStorage.getItem("tf_theme")!=="light");
  const G=dark?DARK:LIGHT;
  const toggleDark=()=>setDark(d=>{localStorage.setItem("tf_theme",d?"light":"dark");return !d;});

  const [currentUser,setCurrentUser]=useState(()=>{
    const t=localStorage.getItem("tf_token");
    if(!t)return null;
    try{return JSON.parse(atob(t.split(".")[1]));}catch{return null;}
  });
  const [page,setPage]=useState("dashboard");
  const [sideOpen,setSideOpen]=useState(false);
  const [projects,setProj]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [users,setUsers]=useState([]);
  const [loading,setLoad]=useState(false);

  const reload=async()=>{
    if(!currentUser)return; setLoad(true);
    try{const [p,t,u]=await Promise.all([api.getProjects(),api.getTasks(),api.getUsers()]);setProj(p);setTasks(t);setUsers(u);}
    catch(e){console.error(e);}finally{setLoad(false);}
  };

  useEffect(()=>{if(currentUser)reload();},[currentUser]);
  useEffect(()=>{document.body.style.background=G.bg;document.body.style.color=G.text;},[dark]);

  const logout=()=>{localStorage.removeItem("tf_token");setCurrentUser(null);};
  const ctx={currentUser,projects,tasks,users,reload,logout};

  const pp={dark,toggleDark};

  if(!currentUser) return <AuthScreen onLogin={u=>setCurrentUser(u)} dark={dark} toggleDark={toggleDark}/>;

  const pages={
    dashboard:<Dashboard {...pp} setPage={setPage}/>,
    projects: <ProjectsPage {...pp}/>,
    tasks:    <TasksPage {...pp}/>,
    team:     <TeamPage {...pp}/>,
  };

  return (
    <ThemeContext.Provider value={G}>
      <AppContext.Provider value={ctx}>
        <style>{css}</style>
        <div className="app-shell" style={{background:G.bg,transition:"background .3s"}}>

          {/* Desktop sidebar — hidden on mobile via CSS */}
          <Sidebar page={page} setPage={setPage} dark={dark} toggleDark={toggleDark} open={sideOpen} onClose={()=>setSideOpen(false)}/>

          {/* Mobile sidebar drawer */}
          <div className={`sb-drawer${sideOpen?" open":""}`} style={{background:G.surface,borderRight:`1px solid ${G.border}`,padding:"22px 14px",width:240,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100vh",zIndex:150,transform:sideOpen?"translateX(0)":"translateX(-100%)",transition:"transform .25s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,background:`linear-gradient(135deg,${G.accent},#818cf8)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⚡</div>
                <span className="syne" style={{fontSize:16,fontWeight:800,color:G.text}}>TaskForge</span>
              </div>
              <button onClick={()=>setSideOpen(false)} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:24,lineHeight:1}}>×</button>
            </div>
            <nav style={{flex:1,display:"flex",flexDirection:"column",gap:3}}>
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>{setPage(n.id);setSideOpen(false);}} style={{display:"flex",alignItems:"center",gap:11,padding:"12px 13px",borderRadius:10,border:"none",cursor:"pointer",background:page===n.id?G.accent+"22":"transparent",color:page===n.id?G.accent:G.muted,fontWeight:page===n.id?600:400,fontSize:15,textAlign:"left",width:"100%",transition:"all .15s"}}>
                  <span style={{fontSize:16}}>{n.icon}</span>{n.label}
                </button>
              ))}
            </nav>
            <div style={{borderTop:`1px solid ${G.border}`,paddingTop:16,display:"flex",flexDirection:"column",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 4px"}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:G.accent+"33",border:`2px solid ${G.accent}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:G.accent,flexShrink:0}}>
                  {currentUser.avatar}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:G.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
                  <div style={{fontSize:11,color:G.muted}}>{currentUser.role}</div>
                </div>
              </div>
              <button onClick={()=>{logout();setSideOpen(false);}} style={{background:G.danger+"15",border:`1px solid ${G.danger}44`,borderRadius:9,color:G.danger,fontSize:14,fontWeight:600,padding:"10px 14px",cursor:"pointer",width:"100%",textAlign:"center"}}>
                Sign out
              </button>
            </div>
          </div>

          {/* Backdrop for mobile drawer */}
          <div className={`bd${sideOpen?" show":""}`} onClick={()=>setSideOpen(false)}/>

          {/* Main content */}
          <main style={{flex:1,overflowY:"auto",minWidth:0,background:G.bg,display:"flex",flexDirection:"column"}}>
            {/* Mobile top bar */}
            <div className="mob-topbar" style={{background:G.surface,borderBottom:`1px solid ${G.border}`,padding:"12px 16px",alignItems:"center",justifyContent:"space-between",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>setSideOpen(true)} style={{background:"none",border:"none",cursor:"pointer",color:G.text,fontSize:22,lineHeight:1,padding:4}}>☰</button>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:26,height:26,background:`linear-gradient(135deg,${G.accent},#818cf8)`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>⚡</div>
                  <span className="syne" style={{fontSize:16,fontWeight:800,color:G.text}}>TaskForge</span>
                </div>
              </div>
              <Toggle dark={dark} toggle={toggleDark}/>
            </div>

            {/* Page content */}
            <div style={{flex:1}}>
              {loading?<Loader/>:pages[page]}
            </div>
          </main>

          {/* Mobile bottom nav */}
          <div className="mob-bottomnav" style={{background:G.surface,borderTop:`1px solid ${G.border}`,padding:"6px 0"}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 14px",color:page===n.id?G.accent:G.muted,minWidth:60,transition:"color .15s"}}>
                <span style={{fontSize:19}}>{n.icon}</span>
                <span style={{fontSize:10,fontWeight:600}}>{n.label}</span>
              </button>
            ))}
          </div>

        </div>
      </AppContext.Provider>
    </ThemeContext.Provider>
  );
}
