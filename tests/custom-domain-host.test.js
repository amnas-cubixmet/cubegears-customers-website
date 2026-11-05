import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import handler from '../api/portal/[...path].js';

const secret = 'workshop-customer-portal-signed-secret-32-characters';
const previousBase = process.env.CUBEGEARS_BACKEND_URL;
const previousSecret = process.env.PORTAL_PROXY_SHARED_SECRET;

test('custom domains are signed per request hostname and use only allowlisted backend paths', async () => {
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.org';
  process.env.PORTAL_PROXY_SHARED_SECRET = secret;
  const originalFetch = global.fetch;
  const headers = [];
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({url: String(url), headers: init.headers});
    return {
      status: 200,
      headers: {
        get: key => key === 'content-type' ? 'application/json' : null,
        getSetCookie: () => [],
      },
      arrayBuffer: async () => Buffer.from('{"name":"Workshop"}'),
    };
  };
  const request = (host) => ({
    method: 'GET', headers: {host,accept:'application/json'},
    query: {path: ['branding']}, socket: {},
  });
  const response = () => ({
    status(code){this.code=code;return this;},
    setHeader(k,v){headers.push([k,v]);},
    appendHeader(){},
    send(bytes){this.payload=bytes;return this;},
    end(){return this;},
    json(data){this.jsonPayload=data;return this;},
  });
  try {
    const first = response(), second = response();
    await handler(request('alpha.example.org'), first);
    await handler(request('beta.example.org'), second);
    assert.equal(first.code, 200);
    assert.equal(second.code, 200);
    assert.equal(calls[0].url, 'https://api.example.org/api/v1/customer-website/branding');
    assert.equal(calls[1].url, calls[0].url);
    const [a,b] = calls.map(c=>c.headers);
    assert.equal(a['X-CG-Portal-Host'], 'alpha.example.org');
    assert.equal(b['X-CG-Portal-Host'], 'beta.example.org');
    assert.notEqual(a['X-CG-Portal-Sig'], b['X-CG-Portal-Sig']);
    for (const h of [a,b]) {
      const expected = createHmac('sha256',secret)
        .update(h['X-CG-Portal-TS']+':'+h['X-CG-Portal-Host']).digest('hex');
      assert.equal(h['X-CG-Portal-Sig'], expected);
    }
    assert.ok(headers.some(([k,v])=>k==='Cache-Control'&&v==='private, no-store'));
  } finally {
    global.fetch=originalFetch;
    if (previousBase === undefined) delete process.env.CUBEGEARS_BACKEND_URL;
    else process.env.CUBEGEARS_BACKEND_URL = previousBase;
    if (previousSecret === undefined) delete process.env.PORTAL_PROXY_SHARED_SECRET;
    else process.env.PORTAL_PROXY_SHARED_SECRET = previousSecret;
  }
});

test('malformed hosts and cross-origin session exchange are blocked before backend fetch', async()=>{
  process.env.CUBEGEARS_BACKEND_URL = 'https://api.example.org';
  process.env.PORTAL_PROXY_SHARED_SECRET = secret;
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async()=>{calls++;throw Error('Should not call upstream');};
  const makeResponse = () => ({
    status(code){this.code=code;return this;},end(){return this;},
    json(){return this;},
  });
  try {
    const invalid=makeResponse();
    await handler({method:'GET',headers:{host:'localhost/../../private'},query:{path:['branding']}}, invalid);
    assert.equal(invalid.code,400);
    const crossOrigin=makeResponse();
    await handler({
      method:'POST',headers:{host:'tenant.example.org',origin:'https://attacker.example.org'},
      query:{path:['session']},
    },crossOrigin);
    assert.equal(crossOrigin.code,403);
    assert.equal(calls,0);
  } finally {
    global.fetch=originalFetch;
    if (previousBase === undefined) delete process.env.CUBEGEARS_BACKEND_URL;
    else process.env.CUBEGEARS_BACKEND_URL = previousBase;
    if (previousSecret === undefined) delete process.env.PORTAL_PROXY_SHARED_SECRET;
    else process.env.PORTAL_PROXY_SHARED_SECRET = previousSecret;
  }
});
