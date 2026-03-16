import NavBar from './components/NavBar';
import './globals.css';

export const metadata = {
  title: 'OpenTelemetry Demo Light',
  description: 'A lightweight OpenTelemetry demo storefront',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
