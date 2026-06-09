import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SupportButton } from '../components/SupportButton';

export const metadata: Metadata = {
  title: 'Next E-Commerce Premium',
  description: 'Modern full-stack e-commerce experience with Next.js, Tailwind, and premium UI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <SupportButton />
        </Providers>
      </body>
    </html>
  );
}
