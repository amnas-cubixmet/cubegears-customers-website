'use client';
import { useState } from 'react';
import { CarFront, Clock3, FileText, Wrench, Wallet } from 'lucide-react';
import { portalApi } from '../api';
import { niceDate, inProgress, rupees } from '../i18n';
import { invoiceTotals } from '../portalBilling';

function latestFirst(items) {
  return [...items].sort((a,b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
}

function VehicleListPhoto({ vehicle, photos, t }) {
  const [imageError,setImageError] = useState(false);
  const photo = photos.find(p => String(p.vehicleId) === String(vehicle.id));
  return (
    <span className="portal-home-vehicle-image">
      {photo && !imageError ? (
        <img src={photo.demoImage || portalApi.photoUrl(photo.id)}
          alt={photo.caption || t.workshopVehiclePhoto} loading="lazy"
          onError={() => setImageError(true)} />
      ) : <CarFront size={29} strokeWidth={1.55} aria-hidden="true"/>}
    </span>
  );
}

export default function CustomerHomeDashboard({ data, t, lang, onVehicleOpen, onRefresh, refreshing,
  refreshError, lastRefreshed }) {
  const vehicles = data.vehicles || [];
  const jobs = data.jobs || [];
  const allPhotos = data.photos || []; // Only server-published, tenant- and customer-scoped photos
  const latest = latestFirst(jobs);
  const latestActive = latest.find(j => inProgress.has(j.status));
  const latestWork = latestActive || latest[0];
  const totals = invoiceTotals(data.invoices);
  const vehicleLabel = id => {
    const vehicle = vehicles.find(v => String(v.id) === String(id));
    return vehicle?.registration || latestWork?.vehicleRegistration || t.vehicles;
  };

  return (
    <main className="wrap dashboard ref-dashboard ref-home-dashboard">
      <div className="welcome portal-home-welcome">
        <div><span className="eyebrow">{niceDate(new Date().toISOString(),lang)}</span>
          <h1>{t.welcome}, {data.customer?.name || t.portal}</h1>
          <p>{t.homeSummaryDescription}</p>
        </div>
      </div>
      <div className="portal-refresh">
        <span>{t.lastChecked}: {lastRefreshed ? niceDate(lastRefreshed,lang) : '—'}</span>
        <button type="button" className="btn btn-outline" disabled={refreshing}
          aria-busy={refreshing} onClick={onRefresh}>
          {refreshing ? t.refreshing : t.refresh}
        </button>
      </div>
      {refreshError && <p className="portal-refresh-error" role="alert">{refreshError}</p>}
      <section className="portal-home-overview" aria-label={t.serviceAtGlance}>
        <div className="portal-home-metrics">
          <div className="portal-home-metric"><CarFront size={20} aria-hidden="true"/><strong>{vehicles.length}</strong><span>{t.vehicles}</span></div>
          <div className="portal-home-metric"><Wrench size={20} aria-hidden="true"/><strong>{jobs.filter(j => inProgress.has(j.status)).length}</strong><span>{t.active}</span></div>
          <div className="portal-home-metric"><Clock3 size={20} aria-hidden="true"/><strong>{jobs.filter(j => !inProgress.has(j.status)).length}</strong><span>{t.history}</span></div>
          <div className="portal-home-metric"><Wallet size={20} aria-hidden="true"/><strong>{rupees(totals.outstanding)}</strong><span>{t.outstanding}</span></div>
        </div>
        <div className="portal-home-latest">
          <div className="portal-home-latest-header">
            <span className="ref-kicker">{t.latestWork}</span>
            <h2>{latestWork ? vehicleLabel(latestWork.vehicleId) : t.noServiceYet}</h2>
          </div>
          {latestWork ? <>
            <div className="portal-home-current-status">
              <span className="portal-status-mark" aria-hidden="true"/>
              <div><span>{t.step}</span><strong>{t[latestWork.stage] || latestWork.status}</strong></div>
            </div>
            <div className="portal-home-latest-meta">
              <span><FileText size={15} aria-hidden="true"/>{latestWork.number}</span>
              <span><Clock3 size={15} aria-hidden="true"/>{niceDate(latestWork.createdAt,lang)}</span>
            </div>
            {vehicles.some(v => String(v.id) === String(latestWork.vehicleId)) && (
              <button className="portal-home-view-latest" type="button"
                onClick={() => onVehicleOpen(latestWork.vehicleId)}>
                {t.viewVehicleDetails}
              </button>
            )}
          </> : <p className="portal-home-muted">{t.noServiceYet}</p>}
        </div>
      </section>

      <section className="portal-home-all-vehicles" aria-labelledby="portal-home-vehicles-heading">
        <div className="portal-home-section-heading">
          <div><span className="ref-kicker">{t.myGarage}</span>
            <h2 id="portal-home-vehicles-heading">{t.vehicles}</h2>
            <p>{t.chooseVehicle}</p></div>
          <span className="portal-home-total">{vehicles.length}</span>
        </div>
        {vehicles.length ? (
          <div className="portal-home-vehicle-list">
            {vehicles.map(vehicle => {
              const vehicleJobs = latest.filter(job => String(job.vehicleId) === String(vehicle.id));
              const last = vehicleJobs[0];
              return (
                <button key={vehicle.id} type="button"
                  className="portal-home-vehicle-card"
                  onClick={() => onVehicleOpen(vehicle.id)}
                  aria-label={t.viewVehicleDetails + ': ' + vehicle.registration}>
                  <VehicleListPhoto vehicle={vehicle} photos={allPhotos} t={t}/>
                  <span className="portal-home-vehicle-main">
                    <strong>{vehicle.registration}</strong>
                    <span>{vehicle.model || t.vehicles}{vehicle.year ? ' · ' + vehicle.year : ''}</span>
                    {last && <small>{t.latestService}: {t[last.stage] || last.status}</small>}
                  </span>
                  <span className="portal-home-vehicle-cta">{t.viewDetails}</span>
                </button>
              );
            })}
          </div>
        ) : <div className="blank">{t.noData}</div>}
      </section>
    </main>
  );
}
