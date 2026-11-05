const API = '/api/portal';

export function csrfCookie() {
  const item = document.cookie.split('; ').find(p => p.startsWith('cg_portal_csrf='));
  return item ? decodeURIComponent(item.slice('cg_portal_csrf='.length)) : '';
}

async function call(path, method = 'GET', data) {
  const headers = {Accept:'application/json'};
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    headers['X-CG-CSRF'] = csrfCookie();
  }
  const result = await fetch(API + path, {
    method,headers,credentials:'same-origin',cache:'no-store',
    referrerPolicy:'no-referrer',body:data === undefined ? undefined : JSON.stringify(data)
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
  branding: () => call('/branding'),
  session: () => call('/session'),
  exchange: token => call('/session','POST',{token}),
  logout: () => call('/logout','POST',{}),
  photoUrl: id => API + '/photos/' + encodeURIComponent(id),
  logoUrl: API + '/logo'
};
