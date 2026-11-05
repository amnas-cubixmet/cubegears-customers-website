import '../src/styles.css';

export const metadata = {
  title: 'Workshop Customer Website',
  description: 'Workshop services and private customer vehicle tracking',
  robots: { index: false, follow: false },
};
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
