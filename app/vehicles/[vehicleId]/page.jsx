import App from '../../../src/App.jsx';

// The URL is a navigation hint only. The Django BFF session remains the
// authority; App validates the requested vehicle ID against that session.
export const dynamic = 'force-dynamic';

export default function VehicleDetailsPage() {
  return <App />;
}
