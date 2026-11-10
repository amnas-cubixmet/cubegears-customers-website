'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {CarFront,CheckCircle2,Clock3,FileText,Globe2,Link2,LogOut,MapPin,Phone,RefreshCw,ShieldCheck,Wallet,Wrench} from 'lucide-react';
import {portalApi} from './api';
import {capturePendingAccessToken} from './accessLink';
import {demoBranding,demoSession} from './demoData';
import {copy,stages,inProgress,niceDate,rupees,cleanPhone} from './i18n';
import {invoiceTotals,invoicePaymentLabel} from './portalBilling';
import PublishedInspectionGallery from './components/PublishedInspectionGallery';
import VehicleOverviewCard, { RecentServiceActivity } from './components/VehicleOverviewCard';

function Contacts({brand,t}){
  const phone=cleanPhone(brand?.phone);
  const wa=cleanPhone(brand?.whatsapp||brand?.phone).replace(/^\+/,'');
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

function Header({brand,lang,setLang,logout,authenticated,t,demoMode=false}){
  return <header className="header"><div className="wrap nav">
    <a href={demoMode ? "/demo" : "/"} className="brand">
      {brand?.hasLogo?<img alt="" src={portalApi.logoUrl}/>:<img alt="" src="/icon.svg" className="brand-fallback-logo"/>}
      <span className="brand-name"><strong>{brand?.publicName||brand?.name||'cubixgear'}</strong></span>
    </a>
    <div className="nav-actions">
      <label className="lang"><Globe2 size={17}/><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value)}><option value="en">English</option><option value="ml">മലയാളം</option></select></label>
      {authenticated&&<button className="logout" onClick={logout} type="button"><LogOut size={17}/><span>{t.logout}</span></button>}
    </div>
  </div></header>;
}
function PublicPage({brand,t,demoMode=false}){
  const workshop=brand?.publicName||brand?.name||'cubixgear';
  const address=[brand?.address,brand?.city].filter(Boolean).join(', ');
  const mapUrl=address?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address):'';
  const whatsapp=cleanPhone(brand?.whatsapp||brand?.phone).replace(/^\+/,'');
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
function Dashboard({data,brand,t,lang,onRefresh,refreshing,refreshError,lastRefreshed,onEstimateDecision,decisionBusy,decisionError,decisionNotice,demoMode}){
  const [selected,setSelected]=useState('all');
  const [query,setQuery]=useState('');
  const [reviewedQuotes,setReviewedQuotes]=useState(()=>new Set());
  const [declineDraft,setDeclineDraft]=useState(null);
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
  return <main className="wrap dashboard ref-dashboard">
    <div className="welcome"><div><span className="eyebrow">{niceDate(new Date().toISOString(),lang)}</span><h1>{t.welcome}, {data.customer?.name||t.portal}</h1><p>{t.greeting}</p></div></div>
    <div className="portal-refresh">
      <span>{t.lastChecked}: {lastRefreshed?niceDate(lastRefreshed,lang):'—'}</span>
      <button type="button" onClick={onRefresh} className="btn btn-outline" disabled={refreshing} aria-busy={refreshing}>
        <RefreshCw size={16}/>{refreshing?t.refreshing:t.refresh}
      </button>
    </div>
    {refreshError&&<p className="portal-refresh-error" role="alert">{refreshError}</p>}
    <nav className="ref-dashboard-tabs" aria-label={t.dashboardSections}>
      <a href="#vehicles">{t.overviewTab}</a>
      <a href="#maintenance">{t.maintenanceTab}</a>
      <a href="#documents">{t.documentsTab}</a>
      <a href="#history">{t.historyTab}</a>
    </nav>
    <div className="ref-dashboard-overview" id="overview">
      <VehicleOverviewCard vehicles={vehicles} jobs={allJobs} photos={data.photos||[]}
        selected={selected} onSelect={setSelected} lang={lang} t={t}/>
      <div className="ref-dashboard-rail">
        <div className="stats" aria-label={t.serviceAtGlance}>
          <div className="stat"><CarFront size={24}/><div><strong>{vehicles.length}</strong><span>{t.vehicles}</span></div></div>
          <div className="stat"><Wrench size={24}/><div><strong>{allJobs.filter(j=>inProgress.has(j.status)).length}</strong><span>{t.active}</span></div></div>
          <div className="stat"><Clock3 size={24}/><div><strong>{allJobs.filter(j=>!inProgress.has(j.status)).length}</strong><span>{t.history}</span></div></div>
          <div className="stat"><Wallet size={24}/><div><strong className="stat-money">{rupees(totals.outstanding)}</strong><span>{t.outstanding}</span></div></div>
        </div>
        <RecentServiceActivity jobs={allJobs} lang={lang} t={t}/>
      </div>
    </div>
    <div className="filter portal-filters" id="vehicles">
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
      <section className="surface" id="maintenance"><div className="section-head"><Wrench size={20}/><h2>{t.active}</h2><span>{active.length}</span></div>
        {active.map(job=><article className="job" key={job.id}><div className="job-top"><div><small>{job.number}</small><h3>{job.vehicleRegistration}</h3><p>{job.vehicleModel}</p></div><span className="tag">{t[job.stage]||job.status}</span></div><Timeline job={job} t={t}/><small className="date">{t.date}: {niceDate(job.createdAt,lang)}</small></article>)}
        {!active.length&&<p className="muted">{t.noData}</p>}
      </section>
      <section className="surface" id="history"><div className="section-head"><Clock3 size={20}/><h2>{t.history}</h2></div>
        {history.map(job=><div className="history" key={job.id}><strong>{job.vehicleRegistration}</strong><span>{job.number}</span><small>{t[job.stage]||job.status} · {niceDate(job.createdAt,lang)}</small></div>)}
        {!history.length&&<p className="muted">{t.noData}</p>}
      </section>
      <PublishedInspectionGallery photos={photos} t={t} lang={lang}/>
      <section className="surface" id="documents"><div className="section-head"><FileText size={20}/><h2>{t.documents}</h2></div>
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
          {d.docKind==='estimate'&&d.decisionReceipt?.id&&
            <div className="portal-quote-receipt" role="status">
              <strong>{t.decisionReceipt}</strong>
              <span>{t.receiptReference}: {d.decisionReceipt.id}</span>
              <span>{t.decisionDate}: {d.decisionReceipt.respondedAt
                ?new Date(d.decisionReceipt.respondedAt).toLocaleString(lang==='ml'?'ml-IN':'en-IN')
                :'—'}</span>
              {d.decisionReceipt.declineFeedback&&
                <div className="portal-decline-receipt">
                  <strong>{t.declineFeedbackTitle}</strong>
                  <span>{t['reason'+d.decisionReceipt.declineFeedback.reason]||t.reasonUnspecified}</span>
                  {d.decisionReceipt.declineFeedback.note&&
                    <p>{d.decisionReceipt.declineFeedback.note}</p>}
                </div>}
            </div>}
          {d.docKind==='estimate'&&d.reviewable&&Array.isArray(d.lines)&&d.lines.length>0&&
            <div className="portal-quote-breakdown">
              <h4>{t.quoteBreakdown}</h4>
              <div className="portal-quote-table-wrap">
                <table className="portal-quote-table">
                  <thead><tr>
                    <th scope="col">{t.quoteItem}</th><th scope="col">{t.quantity}</th>
                    <th scope="col">{t.unitPrice}</th><th scope="col">{t.lineTotal}</th>
                  </tr></thead>
                  <tbody>{d.lines.map((line,index)=><tr key={index}>
                    <td data-label={t.quoteItem}><strong>{line.description}</strong><small>{t['type'+line.type]||line.type}
                      {line.hsnSac?' · HSN/SAC '+line.hsnSac:''}
                      {line.taxRate!==undefined?' · GST '+line.taxRate+'%':''}</small></td>
                    <td data-label={t.quantity}>{line.quantity}</td><td data-label={t.unitPrice}>{rupees(line.unitPrice)}</td>
                    <td data-label={t.lineTotal}>{rupees(line.total)}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <dl className="portal-quote-totals">
                <div><dt>{t.subtotal}</dt><dd>{rupees(d.subtotal)}</dd></div>
                <div><dt>{t.discount}</dt><dd>− {rupees(d.discount)}</dd></div>
                {d.gst&&<>
                  <div><dt>CGST</dt><dd>{rupees(d.gst.cgst)}</dd></div>
                  <div><dt>SGST</dt><dd>{rupees(d.gst.sgst)}</dd></div>
                  <div><dt>IGST</dt><dd>{rupees(d.gst.igst)}</dd></div>
                </>}
                <div><dt>{t.tax}</dt><dd>{rupees(d.tax)}</dd></div>
                <div className="portal-quote-total"><dt>{t.grandTotal}</dt><dd>{rupees(d.total)}</dd></div>
              </dl>
              {d.status==='Awaiting Customer'&&
                <label className="portal-quote-confirm">
                  <input type="checkbox"
                    checked={reviewedQuotes.has(d.id+':'+d.reviewHash)}
                    onChange={event=>setReviewedQuotes(current=>{
                      const next=new Set(current);
                      const key=d.id+':'+d.reviewHash;
                      if(event.target.checked)next.add(key);else next.delete(key);
                      return next;
                    })}
                  />
                  <span>{t.reviewConfirm}</span>
                </label>}
            </div>}
          {d.docKind==='estimate'&&!d.reviewable&&<p className="portal-quote-unavailable">{t.quoteUnavailable}</p>}
          {d.docKind==='estimate'&&d.status==='Awaiting Customer'&&d.reviewable&&d.reviewHash&&d.id&&
             Number(d.version)===latestQuoteVersions.get(String(d.jobId||''))&&
             <div className="portal-estimate-actions">
               <p>{t.reviewNote}</p>
               <button type="button" className="btn btn-solid"
                 disabled={!!decisionBusy||demoMode||!reviewedQuotes.has(d.id+':'+d.reviewHash)}
                 onClick={()=>onEstimateDecision?.(d,'accept')}>
                 <CheckCircle2 size={16}/>{decisionBusy===d.id?t.submitting:t.acceptEstimate}
               </button>
               <button type="button" className="btn btn-outline"
                 disabled={!!decisionBusy||demoMode||!reviewedQuotes.has(d.id+':'+d.reviewHash)}
                 onClick={()=>setDeclineDraft(current=>
                   current?.id===d.id?null:{id:d.id,reason:'',note:''}
                 )}>{t.declineEstimate}</button>
               {declineDraft?.id===d.id&&
                 <div className="portal-decline-form" role="group" aria-label={t.declineFeedbackTitle}>
                   <h4>{t.declineFeedbackTitle}</h4>
                   <p>{t.declineFeedbackHelp}</p>
                   <label>{t.declineReason}
                     <select value={declineDraft.reason}
                       onChange={event=>setDeclineDraft(old=>({...old,reason:event.target.value}))}>
                       <option value="">{t.selectDeclineReason}</option>
                       <option value="price">{t.reasonprice}</option>
                       <option value="items">{t.reasonitems}</option>
                       <option value="timing">{t.reasontiming}</option>
                       <option value="explanation">{t.reasonexplanation}</option>
                       <option value="other">{t.reasonother}</option>
                     </select>
                   </label>
                   <label>{t.declineNote}
                     <textarea rows={3} maxLength={500}
                       value={declineDraft.note}
                       placeholder={t.declineNotePlaceholder}
                       onChange={event=>setDeclineDraft(old=>({...old,note:event.target.value}))}/>
                   </label>
                   <small>{declineDraft.note.length}/500</small>
                   <div className="portal-decline-form-buttons">
                     <button type="button" className="btn btn-outline" disabled={!!decisionBusy}
                       onClick={()=>setDeclineDraft(null)}>{t.cancel}</button>
                     <button type="button" className="btn btn-solid"
                       disabled={!!decisionBusy||demoMode||!declineDraft.reason}
                       onClick={()=>onEstimateDecision?.(d,'decline',{
                         declineReason:declineDraft.reason,
                         declineNote:declineDraft.note
                       })}>
                       {decisionBusy===d.id?t.submitting:t.submitDecline}
                     </button>
                   </div>
                 </div>}
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
  const pendingAccessToken=useRef(null);
  const [accessRetry,setAccessRetry]=useState(0);
  const [refreshing,setRefreshing]=useState(false);
  const [refreshError,setRefreshError]=useState('');
  const [lastRefreshed,setLastRefreshed]=useState(null);
  const [decisionBusy,setDecisionBusy]=useState(null);
  const [decisionError,setDecisionError]=useState('');
  const [decisionNotice,setDecisionNotice]=useState('');
  const t=useMemo(()=>copy[lang],[lang]);
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
      setLastRefreshed(new Date().toISOString());
    }catch(error){
      if(error.status===401){setData(null);setState('public');}
      else setRefreshError(t.refreshFailed);
    }finally{setRefreshing(false);}
  }
  async function decideEstimate(estimate,decision,feedback={}){
    if(demoMode||decisionBusy||!estimate?.id)return;
    const message=(decision==='accept'?t.confirmAccept:t.confirmDecline)
      .replace('{version}',String(estimate.version))
      .replace('{total}',rupees(estimate.total));
    if(!window.confirm(message))return;
    setDecisionBusy(estimate.id);
    setDecisionError('');
    setDecisionNotice('');
    try{
      await portalApi.decideEstimate(estimate.id,estimate.version,decision,estimate.reviewHash,feedback);
      const latest=await portalApi.session();
      if(!latest.customer)throw new Error('Customer session required.');
      setData(latest);
      setLastRefreshed(new Date().toISOString());
      setDecisionNotice(decision==='accept'?t.acceptedNotice:t.declinedNotice);
    }catch(error){
      if(error.status===401){setData(null);setState('public');}
      else setDecisionError(error.status===409?t.quoteChanged
        :error.status===400?t.feedbackInvalid:t.decisionFailed);
    }finally{setDecisionBusy(null);}
  }
  async function logout(){try{await portalApi.logout();setData(null);setState('public');}catch{setErrorKind('unavailable');setState('error');}}
  const theme=branding?{'--accent':branding.primaryColor||'#116f69','--accent-soft':branding.secondaryColor||'#e4f2ec'}:{};
  return <div className="app" lang={lang} style={theme}>
    <Header brand={branding} lang={lang} setLang={setLang} logout={logout} authenticated={state==='dashboard'&&!demoMode} t={t} demoMode={demoMode}/>
    {demoMode&&<div className="demo-banner" role="note"><div className="wrap demo-banner-content"><span><strong>{t.demoLabel}</strong> — {t.demoNotice}</span><a href={demoView==='portal'?'/demo':'/demo/portal'}>{demoView==='portal'?t.demoWorkshop:t.demoTrack} </a></div></div>}
    {['loading','signing'].includes(state)&&<main className="wrap center" role="status"><div className="spinner"/><h1>{state==='signing'?t.signing:t.loading}</h1></main>}
    {state==='error'&&<main className="wrap center" role="alert"><ShieldCheck size={43}/><h1>{t[errorKind]}</h1><p>{t.accessNote}</p><button className="btn btn-outline" onClick={()=>{setState('loading');setAccessRetry(count=>count+1);}}>{t.retry}</button></main>}
    {state==='public'&&<PublicPage brand={branding} t={t} demoMode={demoMode}/>}
    {state==='dashboard'&&data&&<Dashboard data={data} brand={branding} t={t} lang={lang}
      onRefresh={refresh} refreshing={refreshing} refreshError={refreshError} lastRefreshed={lastRefreshed}
      onEstimateDecision={decideEstimate} decisionBusy={decisionBusy} decisionError={decisionError}
      decisionNotice={decisionNotice} demoMode={demoMode}/>}
    <footer className="footer"><div className="wrap"><span>{branding?.publicName||branding?.name||'cubixgear'}</span><span><ShieldCheck size={16}/>{t.footer}</span></div></footer>
  </div>;
}
