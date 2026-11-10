// Read a browser-only access capability once. React Strict Mode can replay
// effects after the URL has already been scrubbed; the in-memory capability
// must survive that replay so the first real exchange is not silently skipped.
// Never store this value in localStorage, logs, cookies or rendered HTML.
export function capturePendingAccessToken(pathname, pendingToken = null) {
  if (!pathname.startsWith('/access/')) return pendingToken;
  let token;
  try {
    token = decodeURIComponent(pathname.slice('/access/'.length));
  } catch {
    throw new Error('Invalid access link');
  }
  if (!/^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) {
    throw new Error('Invalid access link');
  }
  return token;
}
