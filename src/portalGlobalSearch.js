import { inProgress } from './i18n.js';

// Search runs only on the signed-in, workshop-scoped session records returned
// by the portal API. A search result is always linked to an authorized vehicle.
export function buildPortalSearchRecords(session = {}) {
  const vehicles = Array.isArray(session.vehicles) ? session.vehicles : [];
  const jobs = Array.isArray(session.jobs) ? session.jobs : [];
  const invoices = Array.isArray(session.invoices) ? session.invoices : [];
  const estimates = Array.isArray(session.estimates) ? session.estimates : [];
  const allowedVehicles = new Map(vehicles.map(vehicle => [String(vehicle.id), vehicle]));
  const allowedJobs = new Map(
    jobs.filter(job => allowedVehicles.has(String(job.vehicleId)))
      .map(job => [String(job.id), job])
  );

  const entries = [];
  for (const vehicle of vehicles) {
    const vehicleId = String(vehicle.id);
    entries.push({
      key: 'vehicle:' + vehicleId, kind: 'vehicle', vehicleId,
      section: 'overview',
      title: String(vehicle.registration || vehicle.model || ''),
      description: [vehicle.model, vehicle.year].filter(Boolean).join(' · '),
      searchText: [vehicle.registration, vehicle.model, vehicle.year].filter(Boolean).join(' '),
    });
  }

  for (const job of allowedJobs.values()) {
    const vehicle = allowedVehicles.get(String(job.vehicleId));
    entries.push({
      key: 'job:' + String(job.id), kind: 'job',
      vehicleId: String(job.vehicleId), section: inProgress.has(job.status) ? 'maintenance' : 'history',
      title: String(job.number || job.vehicleRegistration || ''),
      description: [vehicle?.registration || job.vehicleRegistration, job.status, job.stage]
        .filter(Boolean).join(' · '),
      searchText: [job.number, job.vehicleRegistration, job.vehicleModel,
        vehicle?.registration, vehicle?.model, job.status, job.stage]
        .filter(Boolean).join(' '),
    });
  }

  for (const invoice of invoices) {
    const job = allowedJobs.get(String(invoice.jobId || ''));
    if (!job) continue;
    const vehicle = allowedVehicles.get(String(job.vehicleId));
    entries.push({
      key: 'invoice:' + String(invoice.id || invoice.number || invoice.jobId),
      kind: 'invoice', vehicleId: String(job.vehicleId),
      section: 'documents', title: String(invoice.number || ''),
      description: [vehicle?.registration || job.vehicleRegistration, invoice.status]
        .filter(Boolean).join(' · '),
      searchText: [invoice.number, invoice.status, job.number,
        vehicle?.registration, job.vehicleRegistration].filter(Boolean).join(' '),
    });
  }

  for (const estimate of estimates) {
    const job = allowedJobs.get(String(estimate.jobId || ''));
    if (!job) continue;
    const vehicle = allowedVehicles.get(String(job.vehicleId));
    entries.push({
      key: 'estimate:' + String(estimate.id || estimate.jobId) + ':' + String(estimate.version || ''),
      kind: 'estimate', vehicleId: String(job.vehicleId),
      section: 'documents', title: job.number || vehicle?.registration || '',
      description: [vehicle?.registration || job.vehicleRegistration,
        estimate.status, estimate.version == null ? '' : 'v' + estimate.version]
        .filter(Boolean).join(' · '),
      searchText: [job.number, vehicle?.registration, job.vehicleRegistration,
        estimate.status, 'estimate', estimate.version == null ? '' : 'v' + estimate.version]
        .filter(Boolean).join(' '),
    });
  }

  return entries;
}

export function searchPortalRecords(entries, query, limit = 8) {
  const term = String(query || '').trim().toLocaleLowerCase();
  if (!term) return [];
  const found = entries.filter(entry =>
    entry.searchText.toLocaleLowerCase().includes(term)
    || entry.title.toLocaleLowerCase().includes(term)
  );
  return found.sort((a, b) => {
    const rank = entry => entry.title.toLocaleLowerCase() === term ? 0 :
      entry.title.toLocaleLowerCase().startsWith(term) ? 1 : 2;
    return rank(a) - rank(b);
  }).slice(0, limit);
}
