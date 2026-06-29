import './globals.css';
import Navbar from '@/components/Navbar';
import PwaRegister from '@/components/PwaRegister';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'BVB Manager — CAYR S1',
  description: 'Gestión del Borussia Dortmund en la CAYR Football Manager League',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BVB Manager',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#FFE500',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport = {
  themeColor: '#FFE500',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-bvb-black text-white">
        <PwaRegister />
        <Navbar />
        {/* pb-20 on mobile to clear the fixed bottom nav bar */}
        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </body>
    </html>
  );
}
