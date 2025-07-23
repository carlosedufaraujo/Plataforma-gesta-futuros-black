import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { UserProvider } from '@/contexts/UserContext';
import { DataProvider } from '@/contexts/DataContext';
import OnboardingCheck from '@/components/Layout/OnboardingCheck';

// Importar utilitário de inspeção em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  import('@/utils/inspectLocalStorage');
  import('@/utils/seedData');
  import('@/utils/clearData');
  import('@/utils/autoCleanMockData'); // Limpeza automática
}

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ACEX Capital Markets - Sistema de Trading de Futuros',
  description: 'Sistema completo para trading de futuros agropecuários com dashboard de análise e gestão de risco.',
  author: 'CEAC Agropecuária e Mercantil Ltda',
  keywords: 'trading, futuros, agronegócio, B3, investimentos, boi gordo, milho, soja'
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
          <DataProvider>
            {children}
            <OnboardingCheck />
          </DataProvider>
        </UserProvider>
      </body>
    </html>
  );
} 