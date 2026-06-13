import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IRVE Platform - Installation de bornes de recharge',
  description: 'Deposez un projet IRVE et trouvez un installateur qualifie pres de chez vous.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
