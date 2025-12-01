import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- STYLES ---
const colors = { primary: '#4f46e5', bg: '#f3f4f6', surface: '#ffffff', textMain: '#111827', textSec: '#6b7280', border: '#e5e7eb', success: '#10b981', successBg: '#ecfdf5', warning: '#f59e0b', warningBg: '#fffbeb', infoBg: '#eff6ff', overlay: 'rgba(0,0,0,0.5)' };
const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: colors.bg, color: colors.textMain },
  sidebar: { width: '260px', background: colors.surface, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', padding: '24px' },
  logo: { fontSize: '20px', fontWeight: '800', color: colors.primary, marginBottom: '40px', display: 'flex', alignItems: 'center', gap:'10px' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  header: { height: '80px', background: colors.surface, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' },
  content: { flex: 1, padding: '32px', overflowY: 'auto', paddingBottom: '60px' },
  connCard: { display: 'flex', flexDirection: 'column', padding: '8px 16px', borderRadius: '12px', border: `1px solid ${colors.border}`, background: colors.bg },
  connRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  connInput: { border: 'none', background: 'transparent', outline: 'none', width: '90px', fontSize: '12px' },
  lastSync: { fontSize: '10px', color: colors.textSec, marginTop: '4px', marginLeft: '16px' },
  btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: '0.2s', fontSize: '13px', display:'flex', alignItems:'center', gap:'6px' },
  navItem: { padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: colors.textSec, display:'flex', justifyContent:'space-between' },
  activeNav: { background: colors.infoBg, color: colors.primary },
  tableCard: { background: colors.surface, borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: `1px solid ${colors.border}`, overflow: 'hidden' },
  row: { padding: '12px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', fontSize: '13px' },
  badge: { padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: colors.overlay, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', width: '600px', maxHeight: '80vh', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' },
  modalHeader: { fontSize: '18px', fontWeight: '700', marginBottom: '15px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px' },
  modalList: { overflowY: 'auto', flex: 1, marginBottom: '20px' }
};

const API_URL = '/api';
const Icons = {
  Cloud: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  Sync: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>,
  Search: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  Deploy: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  External: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
};

const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('en-GB').replace(/\//g, '-'); 
};

// URL FIX: Simple ID Append
const getLightningUrl = (baseUrl, id) => {
    if (!baseUrl || !id) return '#';
    return `${baseUrl}/${id}`;
};

const Conn = ({ env, label, creds, status, meta, onUpdate, onLogin }) => (
    <div style={{...styles.connCard, borderColor: status[env] ? colors.success : colors.border}}>
        <div style={styles.connRow}>
            <div style={{width:8, height:8, borderRadius:'50%', background: status[env] ? colors.success : '#ccc'}}></div>
            {!status[env] ? (
                <>
                    <input style={styles.connInput} value={creds[env].username} placeholder={label} onChange={e=>onUpdate(env,'username',e.target.value)} />
                    <input style={styles.connInput} type="password" value={creds[env].password} placeholder="Pass" onChange={e=>onUpdate(env,'password',e.target.value)} />
                    <input style={styles.connInput} type="password" value={creds[env].token} placeholder="Token" onChange={e=>onUpdate(env,'token',e.target.value)} />
                    <button onClick={()=>onLogin(env)} style={{border:'none', background:'none', color:colors.primary, fontWeight:'bold', cursor:'pointer'}}>Link</button>
                </>
            ) : <span style={{color:colors.success, fontWeight:700}}>{label} Connected</span>}
        </div>
        {status[env] && (
            <div style={styles.lastSync}>
                Last Synced: {meta[env] ? new Date(meta[env]).toLocaleString() : 'Never'}
            </div>
        )}
    </div>
);

export default function App() {
  const [view, setView] = useState('deploy'); 
  const [creds, setCreds] = useState({ source: { username: '', password: '', token: '', loginUrl: 'https://test.salesforce.com' }, target: { username: '', password: '', token: '', loginUrl: 'https://login.salesforce.com' } });
  const [status, setStatus] = useState({ source: false, target: false });
  
  const [appStatus, setAppStatus] = useState({ isBusy: false, action: '', progress: 0, lastSync: { source: null, target: null }, instanceUrls: { source: '', target: '' } });

  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  
  const [deployMsg, setDeployMsg] = useState('');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [testLevel, setTestLevel] = useState('Default');
  const [testClasses, setTestClasses] = useState('');

  const [exploreQuery, setExploreQuery] = useState('');
  const [exploreEnv, setExploreEnv] = useState('target'); 
  const [exploreResults, setExploreResults] = useState([]);

  useEffect(() => {
      const poll = setInterval(async () => {
          try {
              const res = await axios.get(`${API_URL}/status`);
              setAppStatus(res.data);
          } catch(e) {}
      }, 1000);
      return () => clearInterval(poll);
  }, []);

  const updateCred = (env, f, v) => setCreds(p => ({ ...p, [env]: { ...p[env], [f]: v } }));
  const login = async (env) => { try { await axios.post(`${API_URL}/login`, { ...creds[env], envType: env }); setStatus(p => ({ ...p, [env]: true })); } catch (e) { alert(e.message); } };

  const sync = async (env) => {
      try { await axios.post(`${API_URL}/fetch/${env}`); refreshData(); } catch (e) { alert(e.message); }
  };
  const syncAll = async () => {
      try { await axios.post(`${API_URL}/fetch-all`); refreshData(); } catch (e) { alert(e.message); }
  };
  const refreshData = async () => {
      const res = await axios.get(`${API_URL}/state`);
      setData(res.data);
  };

  useEffect(() => { refreshData(); }, []);

  const getDeploymentPackage = () => {
      const components = {};
      selected.forEach(id => {
          const item = data.find(i => i.id === id);
          if (item) {
              if (!components[item.type]) components[item.type] = [];
              if (!components[item.type].includes(item.fullName)) components[item.type].push(item.fullName);
          }
      });
      return components;
  };

  const deploy = async (checkOnly) => {
      if (!status.target) return alert('Connect Target');
      const components = getDeploymentPackage();
      setShowDeployModal(false);
      try {
          const res = await axios.post(`${API_URL}/deploy-standard`, { components, checkOnly, testLevel, runTests: testClasses });
          const jobId = res.data.jobId;
          const iv = setInterval(async () => {
              const s = await axios.get(`${API_URL}/deploy/status/${jobId}`);
              if (s.data.done) { 
                  clearInterval(iv); 
                  if (s.data.success) setDeployMsg('✅ Success');
                  else {
                      const err = s.data.errorMessage || (s.data.details?.componentFailures ? s.data.details.componentFailures[0].problem : 'Unknown Error');
                      setDeployMsg(`❌ Failed: ${err}`);
                  }
              }
          }, 2000);
      } catch (e) { setDeployMsg(e.message); }
  };

  const runExplore = async () => {
      if (!exploreQuery) return;
      const res = await axios.post(`${API_URL}/search`, { query: exploreQuery, env: exploreEnv });
      setExploreResults(res.data);
  };

  const types = Array.from(new Set(data.map(i => i.type))).sort();
  const filtered = data.filter(i => {
      if (filterType !== 'ALL' && i.type !== filterType) return false;
      if (filterStatus !== 'ALL' && i.status !== filterStatus) return false;
      if (search && !i.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
  });
  const toggle = (id) => { const s = new Set(selected); if(s.has(id)) s.delete(id); else s.add(id); setSelected(s); };
  const getBadge = (s) => {
      if (s === 'MATCH') return { background: colors.successBg, color: colors.success };
      if (s === 'CHANGED') return { background: colors.warningBg, color: colors.warning };
      return { background: colors.infoBg, color: colors.primary };
  };

  const DeploymentModal = () => {
      if (!showDeployModal) return null;
      const pkg = getDeploymentPackage();
      const count = Object.values(pkg).reduce((acc, val) => acc + val.length, 0);
      return (
          <div style={styles.modalOverlay} onClick={() => setShowDeployModal(false)}>
              <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <div style={styles.modalHeader}>Review Deployment ({count} Items)</div>
                  <div style={{marginBottom:'15px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                          <label style={{fontSize:'13px', fontWeight:600}}>Validation Level:</label>
                          <select style={{padding:'8px', borderRadius:'6px', border:`1px solid ${colors.border}`}} value={testLevel} onChange={e => setTestLevel(e.target.value)}>
                              <option value="Default">Default</option><option value="NoTestRun">No Test Run</option><option value="RunLocalTests">Run Local Tests</option><option value="RunSpecifiedTests">Run Specified Tests</option>
                          </select>
                      </div>
                      {testLevel === 'RunSpecifiedTests' && <input placeholder="Test Classes (comma sep)..." value={testClasses} onChange={e=>setTestClasses(e.target.value)} style={{width:'95%', padding:'10px', borderRadius:'6px', border:`1px solid ${colors.border}`, fontSize:'13px'}} />}
                  </div>
                  <div style={styles.modalList}>
                      {Object.keys(pkg).map(type => (
                          <div key={type} style={{marginBottom:'15px'}}>
                              <div style={{fontSize:'11px', fontWeight:700, color:colors.textSec}}>{type}</div>
                              {pkg[type].map(name => <div key={name} style={{fontSize:'13px', padding:'4px 0', borderBottom:'1px solid #f3f4f6'}}>{name}</div>)}
                          </div>
                      ))}
                  </div>
                  <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                      <button onClick={()=>setShowDeployModal(false)} style={{...styles.btn, background:'white', color:colors.textMain, border:`1px solid ${colors.border}`}}>Cancel</button>
                      <button onClick={()=>deploy(true)} style={{...styles.btn, background:colors.warningBg, color:colors.warning}}>Validate</button>
                      <button onClick={()=>deploy(false)} style={{...styles.btn, background:colors.success, color:'white'}}>Deploy</button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div style={styles.container}>
        <DeploymentModal />
        <div style={styles.sidebar}>
            <div style={styles.logo}><Icons.Cloud /> ControlV</div>
            <div style={{marginBottom:'30px'}}>
                <div onClick={()=>setView('deploy')} style={{...styles.navItem, ...(view==='deploy'?{background:colors.infoBg, color:colors.primary}:{})}}>Deployer</div>
                <div onClick={()=>setView('explore')} style={{...styles.navItem, ...(view==='explore'?{background:colors.infoBg, color:colors.primary}:{})}}>Explorer (Search)</div>
            </div>
            {view === 'deploy' && (
                <>
                    <div style={{fontSize:'11px', fontWeight:700, color:colors.textSec, marginBottom:'10px'}}>STATUS</div>
                    {['ALL', 'NEW', 'CHANGED', 'MATCH'].map(s => <div key={s} onClick={()=>setFilterStatus(s)} style={{...styles.navItem, background: filterStatus===s ? colors.bg : 'transparent', color: filterStatus===s ? colors.primary : colors.textSec}}>{s}</div>)}
                    <div style={{fontSize:'11px', fontWeight:700, color:colors.textSec, margin:'20px 0 10px'}}>TYPES ({types.length})</div>
                    <div onClick={()=>setFilterType('ALL')} style={{...styles.navItem, background: filterType==='ALL' ? colors.bg : 'transparent'}}>All Types</div>
                    {types.map(t => <div key={t} onClick={()=>setFilterType(t)} style={{...styles.navItem, background: filterType===t ? colors.bg : 'transparent'}}>{t}</div>)}
                </>
            )}
        </div>
        <div style={styles.main}>
            <div style={styles.header}>
                <div style={{display:'flex', gap:'10px'}}>
                    <Conn env="source" label="Source" creds={creds} status={status} meta={appStatus.lastSync} onUpdate={updateCred} onLogin={login} />
                    <Conn env="target" label="Target" creds={creds} status={status} meta={appStatus.lastSync} onUpdate={updateCred} onLogin={login} />
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={syncAll} disabled={appStatus.isBusy} style={{...styles.btn, background:colors.primary, color:'white'}}><Icons.Sync /> Sync All</button>
                    <button onClick={()=>sync('source')} disabled={appStatus.isBusy} style={{...styles.btn, background:'white', border:`1px solid ${colors.border}`, color:colors.textSec}}>Source Only</button>
                    <button onClick={()=>sync('target')} disabled={appStatus.isBusy} style={{...styles.btn, background:'white', border:`1px solid ${colors.border}`, color:colors.textSec}}>Target Only</button>
                </div>
                {appStatus.isBusy && (
                    <div style={{position:'absolute', bottom:0, left:0, right:0, height:'30px', background:'#1e293b', color:'white', display:'flex', alignItems:'center', padding:'0 20px', fontSize:'12px', zIndex:10}}>
                        <div style={{flex:1}}>{appStatus.action}</div>
                        <div>{appStatus.progress}%</div>
                        <div style={{position:'absolute', bottom:0, left:0, height:'3px', background:colors.success, width:`${appStatus.progress}%`, transition:'width 0.2s'}}></div>
                    </div>
                )}
            </div>
            <div style={styles.content}>
                {view === 'deploy' ? (
                    <div style={styles.tableCard}>
                        <div style={{padding:'15px', borderBottom:`1px solid ${colors.border}`, display:'flex', justifyContent:'space-between'}}>
                            <input placeholder="Filter items by name..." value={search} onChange={e=>setSearch(e.target.value)} style={{border:'none', outline:'none', width:'300px', background:'transparent'}} />
                            <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                <span style={{fontSize:'12px', color:colors.textSec}}>{selected.size} selected</span>
                                {selected.size > 0 && <button onClick={()=>setShowDeployModal(true)} disabled={appStatus.isBusy} style={{...styles.btn, background:colors.success, color:'white'}}><Icons.Deploy/> Review</button>}
                                <span style={{fontSize:'12px', fontWeight:700}}>{deployMsg}</span>
                            </div>
                        </div>
                        <div style={{display:'flex', padding:'10px 20px', background:'#f9fafb', borderBottom:`1px solid ${colors.border}`, fontSize:'12px', fontWeight:'700', color:colors.textSec}}>
                            <div style={{width:40}}></div><div style={{flex:2}}>NAME</div><div style={{width:150}}>TYPE</div><div style={{width:100}}>STATUS</div><div style={{width:120, textAlign:'right'}}>LAST MODIFIED</div>
                        </div>
                        <div style={{overflowY:'auto', maxHeight:'calc(100vh - 250px)'}}>
                            {filtered.slice(0,300).map(i => (
                                <div key={i.id} style={{...styles.row, background: selected.has(i.id) ? colors.infoBg : 'transparent'}}>
                                    <div style={{width:40}}><input type="checkbox" checked={selected.has(i.id)} onChange={()=>toggle(i.id)} style={{marginRight:'15px'}} /></div>
                                    <div style={{flex:2, fontWeight:600}}>{i.fullName} <div style={{fontSize:'11px', color:colors.textSec}}>{i.path}</div></div>
                                    <div style={{width:150, fontSize:'13px'}}>{i.type}</div>
                                    <div style={{width:100}}><span style={{...styles.badge, ...getBadge(i.status)}}>{i.status}</span></div>
                                    <div style={{width:120, fontSize:'12px', textAlign:'right', color:colors.textSec}}>{formatDate(i.lastModifiedDate)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={styles.tableCard}>
                        <div style={{padding:'20px', borderBottom:`1px solid ${colors.border}`, display:'flex', gap:'10px', alignItems:'center'}}>
                            <select value={exploreEnv} onChange={e=>setExploreEnv(e.target.value)} style={{padding:'10px', border:`1px solid ${colors.border}`, borderRadius:'6px', fontWeight:'600'}}>
                                <option value="target">Search Target (Prod)</option>
                                <option value="source">Search Source (Dev)</option>
                            </select>
                            <input placeholder="Enter keyword..." value={exploreQuery} onChange={e=>setExploreQuery(e.target.value)} style={{flex:1, padding:'10px', border:`1px solid ${colors.border}`, borderRadius:'6px'}} />
                            <button onClick={runExplore} style={{...styles.btn, background:colors.primary, color:'white'}}>Search</button>
                        </div>
                        {exploreResults.map((res, idx) => (
                            <div key={idx} style={{padding:'15px', borderBottom:`1px solid ${colors.border}`}}>
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                    <div style={{fontWeight:700, color:colors.primary}}>{res.fileName}</div>
                                    {res.id && appStatus.instanceUrls[exploreEnv] && (
                                        <a href={getLightningUrl(appStatus.instanceUrls[exploreEnv], res.id)} target="_blank" rel="noreferrer" style={{display:'flex', alignItems:'center', gap:'5px', textDecoration:'none', color:colors.textMain, fontSize:'12px', fontWeight:'600'}}>
                                            <Icons.External /> Open in Salesforce
                                        </a>
                                    )}
                                </div>
                                <div style={{background:colors.bg, padding:'10px', borderRadius:'6px', fontFamily:'monospace', fontSize:'12px'}}>{res.snippet}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
