import { createHmac } from 'node:crypto';

// Narrow, signed, same-origin BFF. Do not add a generic backend-proxy endpoint.
export async function handlePortalRequest(request, segments) {
  const host = String(request.headers.get('host') || '').toLowerCase();
  if (!/^[a-z0-9.-]+(?::[0-9]{1,5})?$/.test(host) || host.length > 255) {
    return new Response(null, { status: 400 });
  }
  const hostname = host.split(':', 1)[0];
  const isLocal = process.env.NODE_ENV !== 'production' &&
    (['localhost', '127.0.0.1'].includes(hostname) ||
      /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?\.localhost$/.test(hostname) ||
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.test$/.test(hostname));
  const origin = request.headers.get('origin');
  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
  }
  if (request.method === 'POST' && origin && origin !== (isLocal ? 'http://' : 'https://') + host) {
    return new Response(null, { status: 403 });
  }
  const path = Array.isArray(segments) ? segments : [];
  if (!path.length || path.some(part => typeof part !== 'string' || !/^[A-Za-z0-9_-]+$/.test(part))) {
    return new Response(null, { status: 404 });
  }

  const backend = process.env.CUBEGEARS_BACKEND_URL
    || (isLocal ? process.env.PORTAL_BACKEND_URL : '');
  const secret = process.env.PORTAL_PROXY_SHARED_SECRET;
  if (!backend || !secret || secret.length < 32) {
    return Response.json({ message: 'Portal backend is not configured.' }, { status: 503 });
  }
  let url;
  try {
    const parsed = new URL(backend);
    if (parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:'
      && ['localhost', '127.0.0.1'].includes(parsed.hostname))) {
      throw new Error('Backend must use HTTPS');
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('Invalid backend URL');
    url = new URL('/api/v1/customer-website/' + path.join('/'), parsed);
  } catch {
    return Response.json({ message: 'Backend URL must be HTTPS.' }, { status: 503 });
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', secret).update(timestamp + ':' + host).digest('hex');
  const upstreamHeaders = new Headers({
    Accept: request.headers.get('accept') || 'application/json',
    'X-CG-Portal-Host': host,
    'X-CG-Portal-TS': timestamp,
    'X-CG-Portal-Sig': signature,
    'X-CG-Portal-Client': String(
      request.headers.get('x-vercel-forwarded-for') ||
      request.headers.get('x-forwarded-for') || 'unknown'
    ).split(',')[0].trim().slice(0, 64),
  });
  if (request.headers.has('cookie')) upstreamHeaders.set('Cookie', request.headers.get('cookie'));
  if (request.headers.has('x-cg-csrf')) upstreamHeaders.set('X-CG-CSRF', request.headers.get('x-cg-csrf'));
  let body;
  if (request.method === 'POST') {
    const isUpload = path.length === 1 && path[0] === 'uploads';
    if (isUpload) {
      const type = request.headers.get('content-type') || '';
      if (!/^multipart\/form-data;\s*boundary=[A-Za-z0-9'()+_,.\/-]{1,200}$/.test(type)) {
        return Response.json({ message: 'Photo upload must use multipart form data.' }, { status: 415 });
      }
      const limit = 10 * 1024 * 1024 + 32768;
      if (Number(request.headers.get('content-length') || 0) > limit) {
        return Response.json({ message: 'Photo exceeds the 10 MB limit.' }, { status: 413 });
      }
      body = await request.arrayBuffer();
      if (body.byteLength > limit) {
        return Response.json({ message: 'Photo exceeds the 10 MB limit.' }, { status: 413 });
      }
      upstreamHeaders.set('Content-Type', type);
    } else {
      body = await request.text();
      if (Buffer.byteLength(body) > 8192) return new Response(null, { status: 413 });
      upstreamHeaders.set('Content-Type', 'application/json');
    }
  }
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers: upstreamHeaders,
      body,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    });
    if (upstream.headers.has('content-type')) headers.set('Content-Type', upstream.headers.get('content-type'));
    for (const cookie of upstream.headers.getSetCookie?.() || []) {
      headers.append('Set-Cookie', cookie);
    }
    // Do not forward untrusted Location or upstream caching headers.
    return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers });
  } catch {
    return Response.json({ message: 'Workshop service is temporarily unavailable.' },
      { status: 502, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
