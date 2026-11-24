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
  const payload = await result.json().catch(() => null);
  if (!result.ok) {
    const error = new Error(payload?.message || 'Request failed');
    error.status = result.status;
    throw error;
  }
  return payload;
}
export const portalApi = {
  async branding(signal) {
    const branding = await call('/branding', 'GET', undefined, signal);
    if (typeof branding?.name !== 'string' || !branding.name.trim()
      || (branding.publicName !== undefined && typeof branding.publicName !== 'string')) {
      const error = new Error('Invalid website configuration.');
      error.code = 'INVALID_BRANDING';
      throw error;
    }
    return branding;
  },
  session: signal => call('/session','GET',undefined,signal),
  exchange: (token,signal) => call('/session','POST',{token},signal),
  logout: () => call('/logout','POST',{}),
  uploadPhoto: (file, vehicleId) => {
    const form = new FormData();
    form.append('image', file);
    form.append('vehicleId', vehicleId);
    return call('/uploads','POST',form);
  },
  pendingPhotoUrl: id => API + '/uploads/' + encodeURIComponent(id),
  photoUrl: id => API + '/photos/' + encodeURIComponent(id),
  invoicePdfUrl: id => API + '/invoices/' + encodeURIComponent(id) + '/pdf',
  logoUrl: API + '/logo'
};
