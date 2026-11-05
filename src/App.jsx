import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,Camera,CarFront,CheckCircle2,Clock3,FileText,Globe2,LogOut,MapPin,Phone,ShieldCheck,Wrench} from 'lucide-react';
import {portalApi} from './api';
import {copy,stages,inProgress,niceDate,rupees,cleanPhone} from './i18n';

function Contacts({brand,t}){
  const phone=cleanPhone(brand?.phone);
  const wa=cleanPhone(brand?.whatsapp||brand?.phone).replace(/^\+/,'');
  return <div className="contacts">
    {phone&&<a className="btn btn-solid" href={'tel:'+phone}><Phone size={16}/>{t.call}<ArrowRight size={16}/></a>}
    {wa&&<a className="btn btn-outline" href={'https://wa.me/'+wa} rel="noreferrer noopener" target="_blank">{t.whatsapp}<ArrowRight size={16}/></a>}
  </div>;
}
function Header({brand,lang,setLang,logout,authenticated,t}){
  return <header className="header"><div className="wrap nav">
    <a href="/" className="brand">
      {brand?.hasLogo?<img alt="" src={portalApi.logoUrl}/>:<span className="brand-icon"><Wrench size={23}/></span>}
      <span className="brand-name"><strong>{brand?.publicName||brand?.name||'CubeGears'}</strong><small>{t.portal}</small></span>
    </a>
    <div className="nav-actions">
      <label className="lang"><Globe2 size={17}/><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="ml">മലയാളം</option></select></label>
      {authenticated&&<button className="logout" onClick={logout} type="button"><LogOut size={17}/><span>{t.logout}</span></button>}
    </div>
  </div></header>;
}
function PublicPage({brand,t}){
  return <main className="wrap">
    <section className="hero">
      <div className="hero-text"><span className="topline"><span className="indicator"/>{t.label}</span>
        <h1>{brand?.welcomeMessage||t.welcome+' '+(brand?.publicName||brand?.name||'CubeGears')}</h1>
        <p>{brand?.description||t.greeting}</p><Contacts brand={brand} t={t}/>
        <div className="safety"><ShieldCheck size={21}/>{t.safe}</div>
      </div>
      <div className="hero-graphic" aria-hidden="true"><div className="circle circle-a"/><div className="circle circle-b"/><div className="car-graphic"><CarFront size={122} strokeWidth={1.1}/></div><div className="graphic-card"><CheckCircle2 size={19}/>Service tracking</div></div>
    </section>
    <div className="info-grid">
      <section className="surface"><div className="feature-icon"><ShieldCheck size={25}/></div><h2>{t.accessTitle}</h2><p>{t.accessDescription}</p><p className="muted">{t.accessNote}</p></section>
      <section className="surface"><div className="feature-icon"><MapPin size={25}/></div><h2>{t.contact}</h2><strong>{brand?.publicName||brand?.name}</strong><p>{[brand?.address,brand?.city].filter(Boolean).join(', ')}</p><Contacts brand={brand} t={t}/></section>
    </div>
  </main>;
}
function Timeline({job,t}){
  const current=Math.max(0,stages.indexOf(job.stage));
  return <ol className="timeline" aria-label={t.step}>{stages.map((s,i)=><li className={i<=current?'done':''} aria-current={i===current?'step':undefined} key={s}><span>{i<=current?<CheckCircle2 size={17}/>:<span className="empty-dot"/>}</span>{t[s]||s}</li>)}</ol>;
}
function Dashboard({data,brand,t,lang}){
  const [selected,setSelected]=useState('all');
  const [query,setQuery]=useState('');
  const needle=query.trim().toLocaleLowerCase();
  const vehicles=data.vehicles||[];
  const allJobs=data.jobs||[];
  const matchesJob=(j)=>!needle||[j.number,j.vehicleRegistration,j.vehicleModel,j.status]
    .some(value=>String(value||'').toLocaleLowerCase().includes(needle));
  const jobs=allJobs.filter(j=>(selected==='all'||j.vehicleId===selected)&&matchesJob(j));
  const visibleVehicles=vehicles.filter(v=>(selected==='all'||v.id===selected)&&(
    !needle||[v.registration,v.model,v.year].some(value=>String(value||'').toLocaleLowerCase().includes(needle))
  ));
  const active=jobs.filter(j=>inProgress.has(j.status));
  const history=jobs.filter(j=>!inProgress.has(j.status));
  const photos=(data.photos||[]).filter(p=>selected==='all'||p.vehicleId===selected);
  const matchingJobIds=new Set(jobs.map(j=>String(j.id)));
  const docs=[
    ...(data.estimates||[]).map(e=>({...e,key:'e-'+e.jobId+'-'+e.version,label:'Estimate v'+e.version})),
    ...(data.invoices||[]).map(i=>({...i,key:'i-'+i.number,label:i.number}))
  ].filter(d=>(selected==='all'&&!needle)||(
    d.jobId && matchingJobIds.has(String(d.jobId))
  ));
  return <main className="wrap dashboard">
    <div className="welcome"><div><span className="eyebrow">{niceDate(new Date().toISOString(),lang)}</span><h1>{t.welcome}, {data.customer?.name||t.portal}</h1><p>{t.greeting}</p></div><div className="privacy"><ShieldCheck size={19}/>{t.security}</div></div>
    <div className="stats">
      <div className="stat"><CarFront size={24}/><div><strong>{vehicles.length}</strong><span>{t.vehicles}</span></div></div>
      <div className="stat"><Wrench size={24}/><div><strong>{allJobs.filter(j=>inProgress.has(j.status)).length}</strong><span>{t.active}</span></div></div>
      <div className="stat"><Clock3 size={24}/><div><strong>{allJobs.filter(j=>!inProgress.has(j.status)).length}</strong><span>{t.history}</span></div></div>
    </div>
    <div className="filter portal-filters">
      <h2>{t.vehicles}</h2>
      <label className="portal-filter-select">
        <span>{t.filterVehicle}</span>
        <select value={selected} aria-label={t.vehicles} onChange={e=>setSelected(e.target.value)}>
          <option value="all">{t.all}</option>
          {vehicles.map(v=><option value={v.id} key={v.id}>{v.registration} · {v.model}</option>)}
        </select>
      </label>
      <label className="portal-filter-search">
        <span>{t.searchRecords}</span>
        <input type="search" value={query} maxLength={100} onChange={e=>setQuery(e.target.value)}
          placeholder={t.searchPlaceholder} autoComplete="off" />
      </label>
      {(selected!=='all'||query)&&<button className="btn btn-outline" type="button"
        onClick={()=>{setSelected('all');setQuery('');}}>{t.reset}</button>}
    </div>
    <div className="vehicle-grid">{visibleVehicles.map(v=><article className="vehicle" key={v.id}><div className="feature-icon"><CarFront size={27}/></div><div><strong>{v.registration}</strong><span>{v.model} {v.year||''}</span></div></article>)}{!visibleVehicles.length&&<p className="blank">{t.noData}</p>}</div>
    <div className="panel-grid">
      <section className="surface"><div className="section-head"><Wrench size={20}/><h2>{t.active}</h2><span>{active.length}</span></div>
        {active.map(job=><article className="job" key={job.id}><div className="job-top"><div><small>{job.number}</small><h3>{job.vehicleRegistration}</h3><p>{job.vehicleModel}</p></div><span className="tag">{t[job.stage]||job.status}</span></div><Timeline job={job} t={t}/><small className="date">{t.date}: {niceDate(job.createdAt,lang)}</small></article>)}
        {!active.length&&<p className="muted">{t.noData}</p>}
      </section>
      <section className="surface"><div className="section-head"><Clock3 size={20}/><h2>{t.history}</h2></div>
        {history.map(job=><div className="history" key={job.id}><strong>{job.vehicleRegistration}</strong><span>{job.number}</span><small>{t[job.stage]||job.status} · {niceDate(job.createdAt,lang)}</small></div>)}
        {!history.length&&<p className="muted">{t.noData}</p>}
      </section>
      <section className="surface"><div className="section-head"><Camera size={20}/><h2>{t.photos}</h2></div><p className="muted micro">{t.onlyPublished}</p>
        {photos.length?<div className="photo-grid">{photos.map(p=><figure key={p.id}><img loading="lazy" alt={p.caption||p.category} src={portalApi.photoUrl(p.id)}/><figcaption><strong>{p.caption||p.category}</strong><small>{p.phase} · {niceDate(p.capturedAt,lang)}</small></figcaption></figure>)}</div>:<p className="blank">{t.nonePhotos}</p>}
      </section>
      <section className="surface"><div className="section-head"><FileText size={20}/><h2>{t.documents}</h2></div>
        {docs.map(d=><div className="document" key={d.key}><div><strong>{d.label}</strong><small>{d.status}</small></div><b>{rupees(d.total)}</b></div>)}{!docs.length&&<p className="muted">{t.noData}</p>}
        <hr/><h3>{t.contact}</h3><strong>{brand?.publicName||brand?.name}</strong><p className="muted">{brand?.address}</p><Contacts brand={brand} t={t}/>
      </section>
    </div>
  </main>;
}
export default function App(){
  const [lang,setLanguage]=useState(()=>localStorage.getItem('cubegears:portal-language')==='ml'?'ml':'en');
  const [branding,setBranding]=useState(null);
  const [data,setData]=useState(null);
  const [state,setState]=useState('loading');
  const [errorKind,setErrorKind]=useState('unavailable');
  const t=useMemo(()=>copy[lang],[lang]);
  function setLang(next){setLanguage(next);localStorage.setItem('cubegears:portal-language',next);}
  useEffect(()=>{
    let active=true;
    const path=window.location.pathname;
    let token=null;
    if(path.startsWith('/access/')){
      try{token=decodeURIComponent(path.slice(8));}
      catch{
        window.history.replaceState({},'','/');
        setErrorKind('invalid');
        setState('error');
        return undefined;
      }
      window.history.replaceState({},'','/');
    }
    (async()=>{
      try{
        const brand=await portalApi.branding();
        if(!active)return;
        setBranding(brand);
        document.title=(brand.publicName||brand.name||'Workshop')+' | Customer Portal';
        if(token){setState('signing');await portalApi.exchange(token);}
        try{
          const response=await portalApi.session();
          if(!active)return;
          if(response.customer){setData(response);setState('dashboard');}
          else setState('public');
        }catch(e){if(active){if(e.status===401)setState('public');else throw e;}}
      }catch(e){if(active){setErrorKind(token&&[403,404].includes(e.status)?'invalid':'unavailable');setState('error');}}
    })();
    return()=>{active=false;};
  },[]);
  async function logout(){try{await portalApi.logout();setData(null);setState('public');}catch{setErrorKind('unavailable');setState('error');}}
  const theme=branding?{'--accent':branding.primaryColor||'#116f69','--accent-soft':branding.secondaryColor||'#e4f2ec'}:{};
  return <div className="app" lang={lang} style={theme}>
    <Header brand={branding} lang={lang} setLang={setLang} logout={logout} authenticated={state==='dashboard'} t={t}/>
    {['loading','signing'].includes(state)&&<main className="wrap center" role="status"><div className="spinner"/><h1>{state==='signing'?t.signing:t.loading}</h1></main>}
    {state==='error'&&<main className="wrap center" role="alert"><ShieldCheck size={43}/><h1>{t[errorKind]}</h1><p>{t.accessNote}</p><button className="btn btn-outline" onClick={()=>window.location.reload()}>{t.retry}<ArrowRight size={16}/></button></main>}
    {state==='public'&&<PublicPage brand={branding} t={t}/>}
    {state==='dashboard'&&data&&<Dashboard data={data} brand={branding} t={t} lang={lang}/>}
    <footer className="footer"><div className="wrap"><span>{branding?.publicName||branding?.name||'CubeGears'}</span><span><ShieldCheck size={16}/>{t.footer}</span></div></footer>
  </div>;
}
