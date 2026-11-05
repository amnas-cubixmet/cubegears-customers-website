import App from '../src/App.jsx';

// The workshop's verified hostname is resolved by Django through our signed BFF.
// / serves the workshop's PUBLIC branded home page, never another tenant's records.
export const dynamic = 'force-dynamic';
export default function HomePage() {
  return <App />;
}
