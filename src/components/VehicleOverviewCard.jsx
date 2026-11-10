'use client';

import { useState } from 'react';
import { CarFront, CheckCircle2, Clock3, Image as ImageIcon, Wrench } from 'lucide-react';
import { portalApi } from '../api';
import { niceDate, inProgress } from '../i18n';

function newest(items) {
  return [...items].sort((a, b) => {
    const first = Date.parse(a.createdAt || '') || 0;
    const second = Date.parse(b.createdAt || '') || 0;
    return second - first;
  });
}

export default function VehicleOverviewCard({ vehicles = [], jobs = [], photos = [], selected, onSelect, lang, t }) {
  const [failedPhotoId, setFailedPhotoId] = useState(null);
  const featured = vehicles.find(vehicle => vehicle.id === selected)
    || vehicles.find(vehicle => jobs.some(job => job.vehicleId === vehicle.id && inProgress.has(job.status)))
    || vehicles[0];
  const vehicleJobs = featured ? newest(jobs.filter(job => job.vehicleId === featured.id)) : [];
  const latestJob = vehicleJobs[0];
  // These are the existing private session's workshop-published photos only.
  const photo = featured ? photos.find(item => item.vehicleId === featured.id) : null;
  const hasPhoto = Boolean(photo && failedPhotoId !== photo.id);
  const activity = newest(jobs).slice(0, 3);

  return (
    <section className="ref-vehicle-feature" aria-label={t.featuredVehicle}>
      <div className="ref-feature-heading">
        <div>
          <span className="ref-kicker">{t.myGarage}</span>
          <h2>{t.featuredVehicle}</h2>
        </div>
        {vehicles.length > 1 && (
          <label className="ref-feature-selector">
            <span className="sr-only">{t.filterVehicle}</span>
            <select value={featured?.id || ''} onChange={event => onSelect(event.target.value)}>
              {vehicles.map(vehicle =>
                <option key={vehicle.id} value={vehicle.id}>{vehicle.registration}</option>
              )}
            </select>
          </label>
        )}
      </div>
      <div className="ref-vehicle-description">
        <strong>{featured?.model || featured?.registration || t.noVehicleYet}</strong>
        {featured && <span>{featured.registration}{featured.year ? ' · ' + featured.year : ''}</span>}
      </div>
      <div className={'ref-vehicle-stage' + (hasPhoto ? ' ref-has-photo' : '')}>
        {hasPhoto ? (
          <img
            src={photo.demoImage || portalApi.photoUrl(photo.id)}
            alt={photo.caption || t.workshopVehiclePhoto}
            loading="lazy"
            decoding="async"
            onError={() => setFailedPhotoId(photo.id)}
          />
        ) : (
          <div className="ref-vehicle-placeholder" aria-label={t.vehiclePhotoNotAvailable}>
            <span className="ref-vehicle-oval ref-oval-one" aria-hidden="true"/>
            <span className="ref-vehicle-oval ref-oval-two" aria-hidden="true"/>
            <CarFront size={105} strokeWidth={1.25} aria-hidden="true"/>
            <span className="ref-vehicle-no-photo"><ImageIcon size={15} aria-hidden="true"/>{t.vehiclePhotoNotAvailable}</span>
          </div>
        )}
      </div>
      <div className="ref-vehicle-bottom">
        <div className="ref-vehicle-status">
          <span className={'ref-status-dot' + (latestJob && inProgress.has(latestJob.status) ? ' ref-dot-live' : '')}/>
          <div>
            <small>{t.latestService}</small>
            <strong>{latestJob ? (t[latestJob.stage] || latestJob.status) : t.noData}</strong>
          </div>
        </div>
        {latestJob && (
          <div className="ref-vehicle-service-date">
            <small>{t.serviceStarted}</small>
            <strong>{niceDate(latestJob.createdAt, lang)}</strong>
          </div>
        )}
      </div>
    </section>
  );
}

export function RecentServiceActivity({ jobs = [], lang, t }) {
  const activity = newest(jobs).slice(0, 3);
  return (
    <section className="ref-recent-activity" aria-label={t.recentActivity}>
      <div className="ref-activity-head">
        <div>
          <span className="ref-kicker">{t.serviceAtGlance}</span>
          <h2>{t.recentActivity}</h2>
        </div>
        <span className="ref-activity-count">{jobs.length} {t.totalRecords}</span>
      </div>
      {activity.length ? (
        <div className="ref-activity-items">
          {activity.map(job => (
            <div className="ref-activity-item" key={job.id}>
              <span className="ref-activity-icon">
                {inProgress.has(job.status) ? <Wrench size={16} aria-hidden="true"/> :
                  <CheckCircle2 size={17} aria-hidden="true"/>}
              </span>
              <div className="ref-activity-copy">
                <strong>{job.vehicleRegistration || job.vehicleModel || job.number}</strong>
                <small>{job.number} · {niceDate(job.createdAt, lang)}</small>
              </div>
              <span className={'ref-activity-status' + (inProgress.has(job.status) ? ' ref-activity-active' : '')}>
                {t[job.stage] || job.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ref-activity-empty"><Clock3 size={19} aria-hidden="true"/>{t.noData}</div>
      )}
    </section>
  );
}
