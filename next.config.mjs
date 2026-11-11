// Local development only: workshop-specific <label>.localhost addresses.
// Customer data is never selected by a browser-supplied tenant identifier.
const nextConfig = {
  allowedDevOrigins: ['*.localhost'],
};

export default nextConfig;
