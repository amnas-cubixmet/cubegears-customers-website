import { createHmac } from 'node:crypto';

// Server-side same-origin customer API gateway, NOT a general backend proxy.
export default async function handler(req, res) {
  const base = process.env.CUBEGEARS_BACKEND_URL;
  const secret = process.env.PORTAL_PROXY_SHARED_SECRET;
  if (!base || !secret || secret.length < 32) return res.status(503).json({message:'Portal backend is not configured.'});
  if (!['GET','POST'].includes(req.method)) return res.status(405).end();
  const host = String(req.headers.host || '').toLowerCase();
  if (!/^[a-z0-9.-]+(?::[0-9]{1,5})?$/.test(host) || host.length > 255) return res.status(400).end();
  const origin = req.headers.origin;
  if (req.method === 'POST' && origin && origin !== 'https://' + host) return res.status(403).end();
  const part = req.query.path;
  const path = Array.isArray(part) ? part : (part ? [part] : []);
  if (path.some(segment => !/^[A-Za-z0-9_-]+$/.test(segment))) return res.status(404).end();
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac('sha256', secret).update(ts + ':' + host).digest('hex');
  let url;
  try {
    const upstream = new URL(base);
    if (upstream.protocol !== 'https:') throw new Error('Requires HTTPS');
    url = new URL('/api/v1/customer-website/' + path.join('/'), upstream);
  } catch { return res.status(503).json({message:'Backend HTTPS URL is invalid.'}); }
  const headers = {
    'Accept': req.headers.accept || 'application/json',
    'X-CG-Portal-Host':host,'X-CG-Portal-TS':ts,'X-CG-Portal-Sig':sig
  };
  if (req.headers.cookie) headers.Cookie = req.headers.cookie;
  if (req.headers['x-cg-csrf']) headers['X-CG-CSRF'] = req.headers['x-cg-csrf'];
  let body;
  if (req.method === 'POST') {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (body.length > 8192) return res.status(413).end();
    headers['Content-Type'] = 'application/json';
  }
  try {
    const result = await fetch(url, {
      method:req.method,headers,body,redirect:'manual',cache:'no-store',
      signal: AbortSignal.timeout(20000)
    });
    res.status(result.status);
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Content-Type-Options','nosniff');
    for (const cookie of result.headers.getSetCookie()) res.appendHeader('Set-Cookie',cookie);
    const type = result.headers.get('content-type');
    if (type) res.setHeader('Content-Type',type);
    res.send(Buffer.from(await result.arrayBuffer()));
  } catch {
    res.status(502).json({message:'Workshop service is temporarily unavailable.'});
  }
}
