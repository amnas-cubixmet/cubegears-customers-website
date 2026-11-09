// The local customer website uses workshop-specific subdomains, for example:
// http://myworkshop.localhost:5174/. Explicit .test hosts simulate custom
// domains on the developer's own machine; both are permitted only in dev.
// Production custom domains remain controlled by Django/Vercel verification.
const nextConfig = {
  allowedDevOrigins: ['*.localhost', '*.test'],
};

export default nextConfig;
