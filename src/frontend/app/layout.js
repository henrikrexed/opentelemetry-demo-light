import NavBar from './components/NavBar';

export const metadata = {
  title: 'OpenTelemetry Demo Light',
  description: 'A lightweight OpenTelemetry demo storefront',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f5f5f5' }}>
        <NavBar />
        <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
