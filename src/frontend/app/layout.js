export const metadata = {
  title: 'OpenTelemetry Demo Light',
  description: 'A lightweight OpenTelemetry demo storefront',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, background: '#f5f5f5' }}>
        <nav style={{
          background: '#1a1a2e', color: 'white', padding: '1rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <a href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.25rem', fontWeight: 'bold' }}>
            🔭 OTel Demo Light
          </a>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/" style={{ color: '#ccc', textDecoration: 'none' }}>Products</a>
            <a href="/cart" style={{ color: '#ccc', textDecoration: 'none' }}>Cart</a>
          </div>
        </nav>
        <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
