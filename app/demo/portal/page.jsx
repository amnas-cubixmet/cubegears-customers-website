import { notFound } from 'next/navigation';
import App from '../../../src/App.jsx';

export const dynamic = 'force-dynamic';

export default function DemoPortalPage() {
  if (process.env.NODE_ENV === 'production' && process.env.CUBEGEARS_DEMO_ENABLED !== 'true') {
    notFound();
  }
  return <App demoMode demoView="portal" />;
}
