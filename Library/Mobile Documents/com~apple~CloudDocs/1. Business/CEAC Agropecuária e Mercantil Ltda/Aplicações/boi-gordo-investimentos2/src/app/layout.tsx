import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { UserProvider } from '@/contexts/UserContext';
import { HybridDataProvider } from '@/contexts/HybridDataContext';
import OnboardingCheck from '@/components/Layout/OnboardingCheck';

// Remover imports dos arquivos que foram deletados
// if (process.env.NODE_ENV === 'development') {
//   import('@/utils/inspectLocalStorage');
//   import('@/utils/seedData');
//   import('@/utils/clearData');
// }

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ACEX Capital Markets - Sistema de Trading de Futuros',
  description: 'Sistema completo de trading de contratos futuros',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0f0f0f" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <UserProvider>
          <HybridDataProvider>
            {children}
            <OnboardingCheck />
          </HybridDataProvider>
        </UserProvider>
      </body>
    </html>
  );
} 