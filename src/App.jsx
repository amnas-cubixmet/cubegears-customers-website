'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,Camera,CarFront,CheckCircle2,Clock3,FileText,Globe2,LogOut,MapPin,Phone,RefreshCw,ShieldCheck,Wallet,Wrench} from 'lucide-react';
import {portalApi} from './api';
import {demoBranding,demoSession} from './demoData';
import {copy,stages,inProgress,niceDate,rupees,cleanPhone} from './i18n';
import {invoiceTotals,invoicePaymentLabel} from './portalBilling';

function Contacts({brand,t}){
  const phone=cleanPhone(brand?.phone);
  const wa=cleanPhone(brand?.whatsapp||brand?.phone).replace(/^\+/,'');
  return <div className="contacts">
    {phone&&<a className="btn btn-solid" href={'tel:'+phone}><Phone size={16}/>{t.call}<ArrowRight size={16}/></a>}
    {wa&&<a className="btn btn-outline" href={'https://wa.me/'+wa} rel="noreferrer noopener" target="_blank">{t.whatsapp}<ArrowRight size={16}/></a>}
  </div>;
}
function Header({brand,lang,setLang,logout,authenticated,t,demoMode=false}){
  return <header className="header"><div className="wrap nav">
    <a href={demoMode ? "/demo" : "/"} className="brand">
      {brand?.hasLogo?<img alt="" src={portalApi.logoUrl}/>:<span className="brand-icon"><Wrench size={23}/></span>}
      <span className="brand-name"><strong>{brand?.publicName||brand?.name||'CubeGears'}</strong><small>{t.portal}</small></span>
    </a>
    <div className="nav-actions">
      <label className="lang"><Globe2 size={17}/><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="ml">മലയാളം</option></select></label>
      {authenticated&&<button className="logout" onClick={logout} type="button"><LogOut size={17}/><span>{t.logout}</span></button>}
    </div>
  </div></header>;
}
function PublicPage({brand,t,demoMode=false}){
  return <main className="wrap">
    <section className="hero">
      <div className="hero-text"><span className="topline"><span className="indicator"/>{t.label}</span>
        <h1>{brand?.welcomeMessage||t.welcome+' '+(brand?.publicName||brand?.name||'CubeGears')}</h1>
        <p>{brand?.description||t.greeting}</p><Contacts brand={brand} t={t}/>
        {demoMode&&<a className="btn btn-solid demo-hero-action" href="/demo/portal">{t.demoExplore} <ArrowRight size={16}/></a>}
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
function Dashboard({data,brand,t,lang,onRefresh,refreshing,refreshError,lastRefreshed,onEstimateDecision,decisionBusy,decisionError,decisionNotice,demoMode}){
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
  const matchingJobIds=new Set(jobs.map(j=>String(j.id)));
  const photos=(data.photos||[]).filter(p=>(selected==='all'||p.vehicleId===selected)&&(
    !needle||matchingJobIds.has(String(p.jobId))||[p.caption,p.category,p.phase].some(
      value=>String(value||'').toLocaleLowerCase().includes(needle)
    )
  ));
  const docs=[
    ...(data.estimates||[]).map(e=>({...e,key:'e-'+e.jobId+'-'+e.version,label:t.estimate+' v'+e.version,docKind:'estimate'})),
    ...(data.invoices||[]).map(i=>({...i,key:'i-'+i.number,label:i.number,docKind:'invoice'}))
  ].filter(d=>(selected==='all'&&!needle)||(
    d.jobId && matchingJobIds.has(String(d.jobId))
  ));
  const totals=invoiceTotals(data.invoices);
  const latestQuoteVersions=new Map();
  for(const estimate of data.estimates||[]){
    const jobId=String(estimate.jobId||'');
    const version=Number(estimate.version)||0;
    latestQuoteVersions.set(jobId,Math.max(latestQuoteVersions.get(jobId)||0,version));
  }
  return <main className="wrap dashboard">
    <div className="welcome"><div><span className="eyebrow">{niceDate(new Date().toISOString(),lang)}</span><h1>{t.welcome}, {data.customer?.name||t.portal}</h1><p>{t.greeting}</p></div><div className="privacy"><ShieldCheck size={19}/>{t.security}</div></div>
    <div className="portal-refresh">
      <span>{t.lastChecked}: {lastRefreshed?niceDate(lastRefreshed,lang):'—'}</span>
      <button type="button" onClick={onRefresh} className="btn btn-outline" disabled={refreshing} aria-busy={refreshing}>
        <RefreshCw size={16}/>{refreshing?t.refreshing:t.refresh}
      </button>
    </div>
    {refreshError&&<p className="portal-refresh-error" role="alert">{refreshError}</p>}
    <div className="stats">
      <div className="stat"><CarFront size={24}/><div><strong>{vehicles.length}</strong><span>{t.vehicles}</span></div></div>
      <div className="stat"><Wrench size={24}/><div><strong>{allJobs.filter(j=>inProgress.has(j.status)).length}</strong><span>{t.active}</span></div></div>
      <div className="stat"><Clock3 size={24}/><div><strong>{allJobs.filter(j=>!inProgress.has(j.status)).length}</strong><span>{t.history}</span></div></div>
      <div className="stat"><Wallet size={24}/><div><strong className="stat-money">{rupees(totals.outstanding)}</strong><span>{t.outstanding}</span></div></div>
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
        {photos.length?<div className="photo-grid">{photos.map(p=><figure key={p.id}><img loading="lazy" alt={p.caption||p.category} src={p.demoImage || portalApi.photoUrl(p.id)}/><figcaption><strong>{p.caption||p.category}</strong><small>{p.phase} · {niceDate(p.capturedAt,lang)}</small></figcaption></figure>)}</div>:<p className="blank">{t.nonePhotos}</p>}
      </section>
      <section className="surface"><div className="section-head"><FileText size={20}/><h2>{t.documents}</h2></div>
        {decisionError&&<p className="portal-refresh-error" role="alert">{decisionError}</p>}
        {decisionNotice&&<p className="portal-estimate-success" role="status">{decisionNotice}</p>}
        {docs.map(d=><div className="document portal-document" key={d.key}><div>
          <strong>{d.label}</strong>
          <small>{d.docKind==='invoice'?invoicePaymentLabel(d,t):(
            d.status==='Awaiting Customer'?t.awaitingReview:
            d.status==='Customer Approved'?t.customerAccepted:
            d.status==='Customer Rejected'?t.customerDeclined:t.approvedStatus
          )}</small>
          {d.docKind==='invoice'&&<small>{t.paidAmount}: {rupees(d.paid)} · {t.balanceDue}: {rupees(d.balance)}</small>}
          {d.docKind==='estimate'&&d.status==='Customer Approved'&&<small>{t.awaitingWorkshopConfirmation}</small>}
          {d.docKind==='estimate'&&d.status==='Awaiting Customer'&&d.id&&
             Number(d.version)===latestQuoteVersions.get(String(d.jobId||''))&&
             <div className="portal-estimate-actions">
               <p>{t.reviewNote}</p>
               <button type="button" className="btn btn-solid"
                 disabled={!!decisionBusy||demoMode}
                 onClick={()=>onEstimateDecision?.(d,'accept')}>
                 <CheckCircle2 size={16}/>{decisionBusy===d.id?t.submitting:t.acceptEstimate}
               </button>
               <button type="button" className="btn btn-outline"
                 disabled={!!decisionBusy||demoMode}
                 onClick={()=>onEstimateDecision?.(d,'decline')}>{t.declineEstimate}</button>
             </div>}
        </div><b>{rupees(d.total)}</b></div>)}{!docs.length&&<p className="muted">{t.noData}</p>}
        {totals.count>0&&<div className="portal-balance-summary">
          <h3>{t.invoiceOverview}</h3>
          <div><span>{t.invoiced}</span><strong>{rupees(totals.total)}</strong></div>
          <div><span>{t.paidAmount}</span><strong>{rupees(totals.paid)}</strong></div>
          <div className="portal-due"><span>{t.balanceDue}</span><strong>{rupees(totals.outstanding)}</strong></div>
          <p>{t.balanceNote}</p>
        </div>}
        <hr/><h3>{t.contact}</h3><strong>{brand?.publicName||brand?.name}</strong><p className="muted">{brand?.address}</p><Contacts brand={brand} t={t}/>
      </section>
    </div>
  </main>;
}
export default function App({demoMode=false,demoView='public'}){
  const [lang,setLanguage]=useState(() => typeof window !== 'undefined' && window.localStorage.getItem('cubegears:portal-language') === 'ml' ? 'ml' : 'en');
  const [branding,setBranding]=useState(demoMode ? demoBranding : null);
  const [data,setData]=useState(demoMode ? demoSession : null);
  const [state,setState]=useState(demoMode ? (demoView === 'portal' ? 'dashboard' : 'public') : 'loading');
  const [errorKind,setErrorKind]=useState('unavailable');
  const [refreshing,setRefreshing]=useState(false);
  const [refreshError,setRefreshError]=useState('');
  const [lastRefreshed,setLastRefreshed]=useState(null);
  const [decisionBusy,setDecisionBusy]=useState(null);
  const [decisionError,setDecisionError]=useState('');
  const [decisionNotice,setDecisionNotice]=useState('');
  const t=useMemo(()=>copy[lang],[lang]);
  function setLang(next){setLanguage(next);localStorage.setItem('cubegears:portal-language',next);}
  useEffect(()=>{
    if(demoMode){document.title='CubeGears Demo Garage | DEMO PREVIEW';return undefined;}
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
          if(response.customer){setData(response);setLastRefreshed(new Date().toISOString());setState('dashboard');}
          else setState('public');
        }catch(e){if(active){if(e.status===401)setState('public');else throw e;}}
      }catch(e){if(active){setErrorKind(token&&[403,404].includes(e.status)?'invalid':'unavailable');setState('error');}}
    })();
    return()=>{active=false;};
  },[demoMode]);
  async function refresh(){
    if(refreshing || demoMode)return;
    setRefreshing(true);
    setRefreshError('');
    try{
      const response=await portalApi.session();
      if(!response.customer)throw new Error('Customer session unavailable.');
      setData(response);
      setLastRefreshed(new Date().toISOString());
    }catch(error){
      if(error.status===401){setData(null);setState('public');}
      else setRefreshError(t.refreshFailed);
    }finally{setRefreshing(false);}
  }
  async function decideEstimate(estimate,decision){
    if(demoMode||decisionBusy||!estimate?.id)return;
    const message=(decision==='accept'?t.confirmAccept:t.confirmDecline)
      .replace('{version}',String(estimate.version))
      .replace('{total}',rupees(estimate.total));
    if(!window.confirm(message))return;
    setDecisionBusy(estimate.id);
    setDecisionError('');
    setDecisionNotice('');
    try{
      await portalApi.decideEstimate(estimate.id,estimate.version,decision);
      const latest=await portalApi.session();
      if(!latest.customer)throw new Error('Customer session required.');
      setData(latest);
      setLastRefreshed(new Date().toISOString());
      setDecisionNotice(decision==='accept'?t.acceptedNotice:t.declinedNotice);
    }catch(error){
      if(error.status===401){setData(null);setState('public');}
      else setDecisionError(error.status===409?t.quoteChanged:t.decisionFailed);
    }finally{setDecisionBusy(null);}
  }
  async function logout(){try{await portalApi.logout();setData(null);setState('public');}catch{setErrorKind('unavailable');setState('error');}}
  const theme=branding?{'--accent':branding.primaryColor||'#116f69','--accent-soft':branding.secondaryColor||'#e4f2ec'}:{};
  return <div className="app" lang={lang} style={theme}>
    <Header brand={branding} lang={lang} setLang={setLang} logout={logout} authenticated={state==='dashboard'&&!demoMode} t={t} demoMode={demoMode}/>
    {demoMode&&<div className="demo-banner" role="note"><div className="wrap demo-banner-content"><span><strong>{t.demoLabel}</strong> — {t.demoNotice}</span><a href={demoView==='portal'?'/demo':'/demo/portal'}>{demoView==='portal'?t.demoWorkshop:t.demoTrack} <ArrowRight size={15}/></a></div></div>}
    {['loading','signing'].includes(state)&&<main className="wrap center" role="status"><div className="spinner"/><h1>{state==='signing'?t.signing:t.loading}</h1></main>}
    {state==='error'&&<main className="wrap center" role="alert"><ShieldCheck size={43}/><h1>{t[errorKind]}</h1><p>{t.accessNote}</p><button className="btn btn-outline" onClick={()=>window.location.reload()}>{t.retry}<ArrowRight size={16}/></button></main>}
    {state==='public'&&<PublicPage brand={branding} t={t} demoMode={demoMode}/>}
    {state==='dashboard'&&data&&<Dashboard data={data} brand={branding} t={t} lang={lang}
      onRefresh={refresh} refreshing={refreshing} refreshError={refreshError} lastRefreshed={lastRefreshed}
      onEstimateDecision={decideEstimate} decisionBusy={decisionBusy} decisionError={decisionError}
      decisionNotice={decisionNotice} demoMode={demoMode}/>}
    <footer className="footer"><div className="wrap"><span>{branding?.publicName||branding?.name||'CubeGears'}</span><span><ShieldCheck size={16}/>{t.footer}</span></div></footer>
  </div>;
}
