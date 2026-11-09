// The local customer website uses workshop-specific subdomains, for example:
// http://myworkshop.localhost:5174/. Only permit these local origins in dev.
// Production custom domains remain controlled by Django/Vercel verification.
const nextConfig = {
  allowedDevOrigins: ['*.localhost'],
};

export default nextConfig;
