import { notFound } from 'next/navigation';
import App from '../../src/App.jsx';

// Publicly served sample data is strictly opt-in on production deployments.
export const dynamic = 'force-dynamic';

export default function DemoHomePage() {
  if (process.env.NODE_ENV === 'production' && process.env.CUBEGEARS_DEMO_ENABLED !== 'true') {
    notFound();
  }
  return <App demoMode demoView="public" />;
}
