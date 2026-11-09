import '../src/styles.css';

export const metadata = {
  title: 'cubixgear | Workshop Services',
  description: 'Workshop services, vehicle updates and private service tracking',
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
