'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {CarFront,CheckCircle2,Clock3,Download,FileText,Images,Globe2,Link2,LogOut,MapPin,Phone,RefreshCw,ShieldCheck,Wallet,Wrench} from 'lucide-react';
import {portalApi} from './api';
import {capturePendingAccessToken} from './accessLink';
import {demoBranding,demoSession} from './demoData';
import {copy,stages,inProgress,niceDate,rupees,cleanPhone,whatsappDigits} from './i18n';
import {invoiceTotals,invoicePaymentLabel} from './portalBilling';
import PublishedInspectionGallery from './components/PublishedInspectionGallery';
import VehicleOverviewCard, { RecentServiceActivity } from './components/VehicleOverviewCard';
import { dashboardRoute, vehicleListPath, vehicleUrl } from './portalRouting';
import CustomerHomeDashboard from './components/CustomerHomeDashboard';
import PortalGlobalSearch from './components/PortalGlobalSearch';

function Contacts({brand,t}){
  const phone=cleanPhone(brand?.phone);
  const wa=whatsappDigits(brand?.whatsapp||brand?.phone);
  return <div className="contacts">
    {phone&&<a className="btn btn-solid" href={'tel:'+phone}><Phone size={16}/>{t.call}</a>}
    {wa&&<a className="btn btn-outline" href={'https://wa.me/'+wa} rel="noreferrer noopener" target="_blank">{t.whatsapp}</a>}
  </div>;
}
// The host is already tenant-verified by Django's signed branding gateway.
// Use the workshop's own logo for its tab icon when available; otherwise
// leave the bundled cubixgear favicon intact.
function updateSiteFavicon(brand){
  const icon = document.querySelector('link[rel="icon"]') || document.createElement('link');
  icon.rel='icon';
  icon.href=brand?.hasLogo ? portalApi.logoUrl : '/icon.svg';
  if(!icon.isConnected)document.head.appendChild(icon);
}

function Header({brand,lang,setLang,logout,authenticated,t,demoMode=false,session,onVehicleOpen}){
  const customerName = typeof session?.customer?.name === 'string' ? session.customer.name.trim() : '';
  const workshopName = brand?.publicName || brand?.name || 'cubixgear';
  return <header className={'header'+(session?' portal-has-search':'')}><div className="wrap nav">
    <a href={demoMode ? "/demo" : "/"} className="brand">
      {brand?.hasLogo?<img alt="" src={portalApi.logoUrl}/>:<img alt="" src="/icon.svg" className="brand-fallback-logo"/>}
      <span className={`brand-name${customerName ? ' has-portal-customer' : ''}`}>
        {customerName && <strong className="portal-customer-name" title={customerName}>{customerName}</strong>}
        <strong className="portal-workshop-name" title={workshopName}>{workshopName}</strong>
      </span>
    </a>
    {session&&<PortalGlobalSearch session={session} t={t} onVehicleOpen={onVehicleOpen}/>}
    <div className="nav-actions">
      <label className="lang"><Globe2 size={17}/><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="ml">മലയാളം</option></select></label>
      {authenticated&&<button className="logout" aria-label={t.logout} onClick={logout} type="button"><LogOut size={17}/><span>{t.logout}</span></button>}
    </div>
  </div></header>;
}
function PublicPage({brand,t,demoMode=false}){
  const workshop=brand?.publicName||brand?.name||'cubixgear';
  const address=[brand?.address,brand?.city].filter(Boolean).join(', ');
  const mapUrl=address?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address):'';
  const whatsapp=whatsappDigits(brand?.whatsapp||brand?.phone);
  const enquiry=whatsapp?'https://wa.me/'+whatsapp+'?text='+encodeURIComponent(
    t.publicEnquiryMessage.replace('{workshop}',workshop)
  ):'';
  const steps=[
    {icon:CarFront,title:t.publicStepOneTitle,body:t.publicStepOneBody},
    {icon:FileText,title:t.publicStepTwoTitle,body:t.publicStepTwoBody},
    {icon:CheckCircle2,title:t.publicStepThreeTitle,body:t.publicStepThreeBody}
  ];
  return <main className="wrap public-home">
    <section className="hero public-hero">
      <div className="hero-text">
        <span className="topline"><span className="indicator"/>{t.label}</span>
        <h1>{brand?.welcomeMessage||t.welcome+' '+workshop}</h1>
        <p>{brand?.description||t.publicIntro}</p>
        <Contacts brand={brand} t={t}/>
        {enquiry&&<a className="public-enquiry-link" href={enquiry} target="_blank" rel="noopener noreferrer">
          {t.publicEnquiry} 
        </a>}
        {demoMode&&<a className="btn btn-solid demo-hero-action" href="/demo/portal">{t.demoExplore}</a>}
        <div className="safety"><ShieldCheck size={21}/>{t.safe}</div>
      </div>
      <div className="hero-graphic hero-photo">
        <img
          className="hero-real-photo"
          src="https://images.unsplash.com/photo-1643700973089-baa86a1ab9ee?auto=format&fit=crop&w=1400&q=82"
          alt={t.publicHeroPhotoAlt}
          width="900"
          height="1100"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="graphic-card"><CheckCircle2 size={19}/>{t.publicTrackService}</div>
        <a className="hero-photo-credit" href="https://unsplash.com/photos/a-man-working-on-a-car-in-a-garage-jL9zfzTVSwY"
          target="_blank" rel="noopener noreferrer">Photo: Jimmy Nilsson Masth / Unsplash</a>
      </div>
    </section>

    <section className="public-how" aria-labelledby="public-how-title">
      <div className="public-section-heading">
        <span className="public-overline">{t.publicServiceExperience}</span>
        <h2 id="public-how-title">{t.publicHowTitle}</h2>
        <p>{t.publicHowDescription}</p>
      </div>
      <div className="public-steps">
        {steps.map(({icon:Icon,title,body},index)=><article className="public-step" key={title}>
          <span className="public-step-icon"><Icon size={23}/></span>
          <span className="public-step-number">0{index+1}</span>
          <h3>{title}</h3><p>{body}</p>
        </article>)}
      </div>
    </section>

    <section className="public-info-grid" aria-label={t.publicContactAndAccess}>
      <article className="surface public-contact-card">
        <span className="public-overline">{t.contact}</span>
        <h2>{workshop}</h2>
        {address&&<p className="public-address"><MapPin size={19}/><span>{address}</span></p>}
        <Contacts brand={brand} t={t}/>
        {mapUrl&&<a className="public-directions" href={mapUrl} target="_blank" rel="noopener noreferrer">
          <MapPin size={17}/>{t.publicDirections}
        </a>}
        {!address&&!brand?.phone&&!brand?.whatsapp&&<p className="muted">{t.publicContactUnavailable}</p>}
      </article>
      <article className="surface public-access-card">
        <div className="public-access-top"><div className="feature-icon"><Link2 size={24}/></div>
          <span className="public-overline">{t.privateLinkLabel}</span>
        </div>
        <h2>{t.accessTitle}</h2>
        <p>{t.accessDescription}</p>
        <div className="public-secure-link-card">
          <Link2 size={20} aria-hidden="true"/>
          <div><strong>{t.privateLinkTitle}</strong>
            <span>{t.accessNote}</span>
          </div>
        </div>
      </article>
    </section>
  </main>;
}

function Timeline({job,t}){
  const current=Math.max(0,stages.indexOf(job.stage));
  return <ol className="timeline" aria-label={t.step}>{stages.map((s,i)=><li className={i<=current?'done':''} aria-current={i===current?'step':undefined} key={s}><span>{i<=current?<CheckCircle2 size={17}/>:<span className="empty-dot"/>}</span>{t[s]||s}</li>)}</ol>;
}
const vehicleTabs = [
  { key: 'overview', label: 'overviewTab', Icon: CarFront },
  { key: 'maintenance', label: 'maintenanceTab', Icon: Wrench },
  { key: 'photos', label: 'photosTab', Icon: Images },
  { key: 'documents', label: 'documentsTab', Icon: FileText },
  { key: 'history', label: 'historyTab', Icon: Clock3 },
];

function VehicleTabPanel({ tab, activeTab, children }) {
  const selected = tab === activeTab;
  return <div className="ref-vehicle-tab-panel" role="tabpanel" id={`vehicle-panel-${tab}`}
    aria-labelledby={`vehicle-tab-${tab}`} hidden={!selected} tabIndex={0}>
    {selected && children}
  </div>;
}

function Dashboard({data,brand,t,lang,onRefresh,refreshing,refreshError,lastRefreshed,vehicleId,onVehicleList,onVehicleOpen,activeTab,onTabChange}){
  const selected = vehicleId;
  const tabButtons = useRef({});
  const tabContent = useRef(null);

  function selectTab(tab, focus = false) {
    if (focus) tabButtons.current[tab]?.focus({ preventScroll: true });
    if (tab === activeTab) return;
    if (tabContent.current.getBoundingClientRect().top < 0) {
      tabContent.current.scrollIntoView({ block: 'start' });
    }
    onTabChange(tab);
  }

  function onTabKeyDown(event, index) {
    const last = vehicleTabs.length - 1;
    let next;
    switch (event.key) {
      case 'ArrowLeft': next = index === 0 ? last : index - 1; break;
      case 'ArrowRight': next = index === last ? 0 : index + 1; break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      default: return;
    }
    event.preventDefault();
    selectTab(vehicleTabs[next].key, true);
  }

  const vehicles=data.vehicles||[];
  const allJobs=data.jobs||[];
  const scopedJobs=allJobs.filter(j=>String(j.vehicleId)===String(vehicleId));
  const scopedJobIds=new Set(scopedJobs.map(j=>String(j.id)));
  const scopedInvoices=(data.invoices||[]).filter(i=>scopedJobIds.has(String(i.jobId)) ||
    (!i.jobId && i.vehicleId && String(i.vehicleId)===String(selected)));
  const jobs=scopedJobs;
  const active=jobs.filter(j=>inProgress.has(j.status));
  const history=jobs.filter(j=>!inProgress.has(j.status));
  const photos=(data.photos||[]).filter(p=>String(p.vehicleId)===String(selected));
  const totals=invoiceTotals(scopedInvoices);
  return <main className="wrap dashboard ref-dashboard ref-vehicle-details">
    <div className="portal-vehicle-navigation">
      <nav className="portal-vehicle-breadcrumb" aria-label={t.breadcrumbLabel}>
        <button type="button" onClick={onVehicleList}>{t.vehicles}</button>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{vehicles.find(v=>String(v.id)===String(vehicleId))?.registration||t.featuredVehicle}</span>
      </nav>
      <button type="button" className="portal-back-home"
        onClick={onVehicleList}>{t.backToHome}</button>
    </div>
    <div className="welcome"><div><span className="eyebrow">{niceDate(new Date().toISOString(),lang)}</span><h1>{t.welcome}, {data.customer?.name||t.portal}</h1><p>{t.greeting}</p></div></div>
    <div className="portal-refresh">
      <span>{t.lastChecked}: {lastRefreshed?niceDate(lastRefreshed,lang):'—'}</span>
      <button type="button" onClick={onRefresh} className="btn btn-outline" disabled={refreshing} aria-busy={refreshing}>
        <RefreshCw size={16}/>{refreshing?t.refreshing:t.refresh}
      </button>
    </div>
    {refreshError&&<p className="portal-refresh-error" role="alert">{refreshError}</p>}
    <div className="ref-vehicle-tabs-content" ref={tabContent}>
      <div className="ref-dashboard-tabs" role="tablist" aria-label={t.dashboardSections}>
        {vehicleTabs.map(({ key, label, Icon }, index) => <button
          key={key} ref={element => { tabButtons.current[key] = element; }}
          type="button" role="tab" id={`vehicle-tab-${key}`} aria-controls={`vehicle-panel-${key}`}
          aria-selected={activeTab === key} tabIndex={activeTab === key ? 0 : -1}
          onClick={() => selectTab(key)} onKeyDown={event => onTabKeyDown(event, index)}>
          <Icon size={19} aria-hidden="true"/>{t[label]}
        </button>)}
      </div>
      <VehicleTabPanel tab="overview" activeTab={activeTab}>
        <div className="ref-dashboard-overview">
          <VehicleOverviewCard vehicles={vehicles} jobs={scopedJobs} photos={photos}
            selected={selected} onSelect={onVehicleOpen} onShowPhotos={() => selectTab('photos', true)} lang={lang} t={t}/>
          <div className="ref-dashboard-rail">
            <div className="stats" aria-label={t.serviceAtGlance}>
              <button type="button" className="stat portal-vehicle-list-button" onClick={onVehicleList}>
                <CarFront size={24} aria-hidden="true"/><div><strong>{vehicles.length}</strong><span>{t.vehicles}</span></div>
              </button>
              <div className="stat"><Wrench size={24}/><div><strong>{scopedJobs.filter(j=>inProgress.has(j.status)).length}</strong><span>{t.active}</span></div></div>
              <div className="stat"><Clock3 size={24}/><div><strong>{scopedJobs.filter(j=>!inProgress.has(j.status)).length}</strong><span>{t.history}</span></div></div>
              <div className="stat"><Wallet size={24}/><div><strong className="stat-money">{rupees(totals.outstanding)}</strong><span>{t.outstanding}</span></div></div>
            </div>
            <RecentServiceActivity jobs={scopedJobs} lang={lang} t={t}/>
          </div>
        </div>
      </VehicleTabPanel>
      <VehicleTabPanel tab="maintenance" activeTab={activeTab}>
        <section className="surface"><div className="section-head"><Wrench size={20}/><h2>{t.active}</h2><span>{active.length}</span></div>
          {active.map(job=><article className="job" key={job.id}><div className="job-top"><div><small>{job.number}</small><h3>{job.vehicleRegistration}</h3><p>{job.vehicleModel}</p></div><span className="tag">{t[job.stage]||job.status}</span></div><Timeline job={job} t={t}/><small className="date">{t.date}: {niceDate(job.createdAt,lang)}</small></article>)}
          {!active.length&&<p className="muted">{t.noData}</p>}
        </section>
      </VehicleTabPanel>
      <VehicleTabPanel tab="history" activeTab={activeTab}>
        <section className="surface"><div className="section-head"><Clock3 size={20}/><h2>{t.history}</h2></div>
          {history.map(job=><div className="history" key={job.id}><strong>{job.vehicleRegistration}</strong><span>{job.number}</span><small>{t[job.stage]||job.status} · {niceDate(job.createdAt,lang)}</small></div>)}
          {!history.length&&<p className="muted">{t.noData}</p>}
        </section>
      </VehicleTabPanel>
      <VehicleTabPanel tab="photos" activeTab={activeTab}>
        <PublishedInspectionGallery photos={photos} t={t} lang={lang}/>
      </VehicleTabPanel>
      <VehicleTabPanel tab="documents" activeTab={activeTab}>
        <section className="surface"><div className="section-head"><FileText size={20}/><h2>{t.documents}</h2></div>
          {scopedInvoices.map(invoice => (
            <div className="document portal-document" key={invoice.id || invoice.number}>
              <div>
                <strong>{invoice.number}</strong>
                <small>{invoicePaymentLabel(invoice, t)}</small>
                <small>{t.paidAmount}: {rupees(invoice.paid)} · {t.balanceDue}: {rupees(invoice.balance)}</small>
              </div>
              <aside className="portal-document-actions">
                <b>{rupees(invoice.total)}</b>
                {invoice.id && <a className="btn btn-outline" href={portalApi.invoicePdfUrl(invoice.id)} download>
                  <Download size={17} aria-hidden="true"/>{t.downloadPdf}
                </a>}
              </aside>
            </div>
          ))}
          {!scopedInvoices.length && <p className="muted">{t.noData}</p>}
          {totals.count>0&&<div className="portal-balance-summary">
            <h3>{t.invoiceOverview}</h3>
            <div><span>{t.invoiced}</span><strong>{rupees(totals.total)}</strong></div>
            <div><span>{t.paidAmount}</span><strong>{rupees(totals.paid)}</strong></div>
            <div className="portal-due"><span>{t.balanceDue}</span><strong>{rupees(totals.outstanding)}</strong></div>
            <p>{t.balanceNote}</p>
          </div>}
          <hr/><h3>{t.contact}</h3><strong>{brand?.publicName||brand?.name}</strong><p className="muted">{brand?.address}</p><Contacts brand={brand} t={t}/>
        </section>
      </VehicleTabPanel>
    </div>
  </main>;
}
const homeView = { kind: 'home', vehicleId: null, tab: 'overview' };

export default function App({demoMode=false,demoView='public'}){
  const [lang,setLanguage]=useState(() => typeof window !== 'undefined' && window.localStorage.getItem('cubegears:portal-language') === 'ml' ? 'ml' : 'en');
  const [branding,setBranding]=useState(demoMode ? demoBranding : null);
  const [data,setData]=useState(demoMode ? demoSession : null);
  const [vehicleView, setVehicleView] = useState(homeView);
  const [state,setState]=useState(demoMode ? (demoView === 'portal' ? 'dashboard' : 'public') : 'loading');
  const [errorKind,setErrorKind]=useState('unavailable');
  const pendingAccessToken=useRef(null);
  const [accessRetry,setAccessRetry]=useState(0);
  const [refreshing,setRefreshing]=useState(false);
  const [refreshError,setRefreshError]=useState('');
  const [lastRefreshed,setLastRefreshed]=useState(null);
  const t=useMemo(()=>copy[lang],[lang]);
  // Vehicle IDs are authorized against the signed-in session, never from URL alone.
  function syncVehicleRoute(session, resetTab = false) {
    const { pathname, search, hash } = window.location;
    const route = dashboardRoute(session?.vehicles || [], pathname);
    const fragment = hash === '#inspection-photos' ? 'photos' : hash.slice(1);
    const legacyTab = route.vehicleId && vehicleTabs.some(({ key }) => key === fragment) ? fragment : null;

    setVehicleView(current => {
      const tab = legacyTab || (resetTab || route.vehicleId !== current.vehicleId ? 'overview' : current.tab);
      return current.kind === route.kind && current.vehicleId === route.vehicleId && current.tab === tab
        ? current : { kind: route.kind, vehicleId: route.vehicleId, tab };
    });
    if (!demoMode && (pathname !== route.path || legacyTab)) {
      window.history.replaceState({}, '', route.path + search);
    }
  }
  function openVehicle(vehicleId, section) {
    const allowed=data?.vehicles?.find(v=>String(v.id)===String(vehicleId));
    if(!allowed)return;
    const tab = vehicleTabs.some(({ key }) => key === section) ? section : 'overview';
    const path = vehicleUrl(allowed.id);
    setVehicleView({ kind: 'vehicle', vehicleId: String(allowed.id), tab });
    if (!demoMode && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({top:0,behavior:'instant'});
  }
  function openVehicleList() {
    setVehicleView({ ...homeView, kind: 'vehicles' });
    if (!demoMode && window.location.pathname !== vehicleListPath) {
      window.history.pushState({}, '', vehicleListPath);
    }
    window.scrollTo({top:0,behavior:'instant'});
  }
  useEffect(()=>{
    if(demoMode||state!=='dashboard'||!data)return undefined;
    const onPopState=()=>syncVehicleRoute(data, true);
    window.addEventListener('popstate',onPopState);
    return()=>window.removeEventListener('popstate',onPopState);
  },[demoMode,state,data]);
  function setLang(next){setLanguage(next);localStorage.setItem('cubegears:portal-language',next);}
  useEffect(()=>{
    if(demoMode){document.title='cubixgear Demo Garage';return undefined;}
    let active=true;
    const controller=new AbortController();
    const path=window.location.pathname;
    let token=pendingAccessToken.current;
    if(path.startsWith('/access/')){
      try{
        token=capturePendingAccessToken(path,token);
        pendingAccessToken.current=token;
      }catch{
        pendingAccessToken.current=null;
        window.history.replaceState({},'','/');
        setErrorKind('invalid');
        setState('error');
        return undefined;
      }
      // Remove the bearer capability from the visible URL and browser history
      // before network requests; the ref survives Strict Mode effect replays.
      window.history.replaceState({},'','/');
    }
    (async()=>{
      let exchangeStarted=false;
      try{
        const brand=await portalApi.branding(controller.signal);
        if(!active)return;
        setBranding(brand);
        updateSiteFavicon(brand);
        document.title=(brand.publicName||brand.name||'Workshop')+' | cubixgear';
        if(token){
          setState('signing');
          exchangeStarted=true;
          await portalApi.exchange(token,controller.signal);
          if(!active)return;
        }
        try{
          const response=await portalApi.session(controller.signal);
          if(!active)return;
          if(response.customer){
            pendingAccessToken.current=null;
            setData(response);
            syncVehicleRoute(response);
            setLastRefreshed(new Date().toISOString());
            setState('dashboard');
          }else if(token){
            throw new Error('Session not established');
          }else setState('public');
        }catch(e){
          if(!active)return;
          if(e.status===401 && !token)setState('public');
          else throw e;
        }
      }catch(e){
        if(!active)return;
        // Only a 404 from the token exchange itself says that the link is
        // invalid. Branding failures and CSRF 403s are service/config errors.
        const invalid=exchangeStarted && e.status===404;
        if(invalid)pendingAccessToken.current=null;
        setErrorKind(invalid?'invalid':'unavailable');
        setState('error');
      }
    })();
    return()=>{active=false;controller.abort();};
  },[demoMode,accessRetry]);
  async function refresh(){
    if(refreshing || demoMode)return;
    setRefreshing(true);
    setRefreshError('');
    try{
      const response=await portalApi.session();
      if(!response.customer)throw new Error('Customer session unavailable.');
      setData(response);
      syncVehicleRoute(response);
      setLastRefreshed(new Date().toISOString());
    }catch(error){
      if(error.status===401){setData(null);setState('public');}
      else setRefreshError(t.refreshFailed);
    }finally{setRefreshing(false);}
  }
  async function logout(){try{await portalApi.logout();setData(null);setVehicleView(homeView);window.history.replaceState({},'','/');setState('public');}catch{setErrorKind('unavailable');setState('error');}}
  const theme=branding?{'--accent':branding.primaryColor||'#116f69','--accent-soft':branding.secondaryColor||'#e4f2ec'}:{};
  return <div className="app" lang={lang} style={theme}>
    <Header brand={branding} lang={lang} setLang={setLang} logout={logout}
      authenticated={state==='dashboard'&&!demoMode} t={t} demoMode={demoMode}
      session={state==='dashboard'?data:null} onVehicleOpen={openVehicle}/>
    {demoMode&&<div className="demo-banner" role="note"><div className="wrap demo-banner-content"><span><strong>{t.demoLabel}</strong> — {t.demoNotice}</span><a href={demoView==='portal'?'/demo':'/demo/portal'}>{demoView==='portal'?t.demoWorkshop:t.demoTrack} </a></div></div>}
    {['loading','signing'].includes(state)&&<main className="wrap center" role="status"><div className="spinner"/><h1>{state==='signing'?t.signing:t.loading}</h1></main>}
    {state==='error'&&<main className="wrap center" role="alert"><ShieldCheck size={43}/><h1>{t[errorKind]}</h1><p>{t.accessNote}</p><button className="btn btn-outline" onClick={()=>{setState('loading');setAccessRetry(count=>count+1);}}>{t.retry}</button></main>}
    {state==='public'&&<PublicPage brand={branding} t={t} demoMode={demoMode}/>}
    {state==='dashboard'&&data&&(!vehicleView.vehicleId
      ? <CustomerHomeDashboard data={data} t={t} lang={lang} onVehicleOpen={openVehicle} vehiclesOnly={vehicleView.kind === 'vehicles'}
          onRefresh={refresh} refreshing={refreshing} refreshError={refreshError} lastRefreshed={lastRefreshed}/>
      : <Dashboard key={vehicleView.vehicleId} data={data} brand={branding} t={t} lang={lang} vehicleId={vehicleView.vehicleId}
          activeTab={vehicleView.tab} onTabChange={tab => setVehicleView(current => ({ ...current, tab }))}
          onVehicleList={openVehicleList} onVehicleOpen={openVehicle}
          onRefresh={refresh} refreshing={refreshing} refreshError={refreshError} lastRefreshed={lastRefreshed}/>)}
    <footer className="footer"><div className="wrap"><span>{branding?.publicName||branding?.name||'cubixgear'}</span><span><ShieldCheck size={16}/>{t.footer}</span></div></footer>
  </div>;
}
