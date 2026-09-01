import type { Metadata } from 'next';
import './globals.css';
import './workspace.css';
import './calendar.css';
import './theme.css';
import { AppProvider } from '@/components/scola/provider';
export const metadata: Metadata = {
  title: 'Scola · Axenda docente',
  description:
    'O teu espazo persoal para organizar alumnado, clases, axenda e diario docente.',
  robots: { index: false, follow: false },
  icons: { icon: { url: '/scola-app-icon.png', type: 'image/png' } },
  openGraph: {
    title: 'Scola · Axenda docente',
    description: 'Espazo para ensinar. Tempo para o que importa.',
    locale: 'gl_ES',
    type: 'website',
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="gl">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
