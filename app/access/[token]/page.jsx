import App from '../../../src/App.jsx';

// Client exchanges the secure link for an HttpOnly session, then replaces URL with '/'.
export const dynamic = 'force-dynamic';
export default function AccessPage() {
  return <App />;
}
