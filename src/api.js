const API = '/api/portal';

export function csrfCookie() {
  const item = document.cookie.split('; ').find(p => p.startsWith('cg_portal_csrf='));
  return item ? decodeURIComponent(item.slice('cg_portal_csrf='.length)) : '';
}

async function call(path, method = 'GET', data, signal) {
  const headers = {Accept:'application/json'};
  if (method !== 'GET') {
    if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json';
    headers['X-CG-CSRF'] = csrfCookie();
  }
  const result = await fetch(API + path, {
    method,headers,signal,credentials:'same-origin',cache:'no-store',
    referrerPolicy:'no-referrer',body:data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data)
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = result.status;
    throw error;
  }
  return payload;
}
export const portalApi = {
  branding: signal => call('/branding','GET',undefined,signal),
  session: signal => call('/session','GET',undefined,signal),
  exchange: (token,signal) => call('/session','POST',{token},signal),
  logout: () => call('/logout','POST',{}),
  decideEstimate: (id, version, decision, reviewHash, feedback = {}) => call(
    '/estimates/' + encodeURIComponent(id) + '/decision', 'POST',
    {version, decision, reviewHash,
      ...(decision === 'decline'
        ? { declineReason: feedback.declineReason, declineNote: feedback.declineNote || '' }
        : {})}
  ),
  uploadPhoto: (file, vehicleId) => {
    const form = new FormData();
    form.append('image', file);
    form.append('vehicleId', vehicleId);
    return call('/uploads','POST',form);
  },
  pendingPhotoUrl: id => API + '/uploads/' + encodeURIComponent(id),
  photoUrl: id => API + '/photos/' + encodeURIComponent(id),
  logoUrl: API + '/logo'
};
