import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHmac } from 'node:crypto';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.PORTAL_BACKEND_URL || 'http://127.0.0.1:8000';
  const secret = env.PORTAL_PROXY_SHARED_SECRET || '';
  return {
    plugins: [react()],
    server: { port: 5174, proxy: {
      '/api/portal': {
        target: backend, changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/portal/, '/api/v1/customer-website'),
        configure(proxy) {
          proxy.on('proxyReq', (request, incoming) => {
            const host = incoming.headers.host || 'localhost:5174';
            const ts = String(Math.floor(Date.now() / 1000));
            const sig = createHmac('sha256', secret).update(ts + ':' + host).digest('hex');
            request.setHeader('X-CG-Portal-Host', host);
            request.setHeader('X-CG-Portal-TS', ts);
            request.setHeader('X-CG-Portal-Sig', sig);
            request.setHeader('X-CG-Portal-Client', incoming.socket.remoteAddress || 'local');
            request.removeHeader('origin');
            request.removeHeader('referer');
          });
        },
      }
    }}
  };
});
