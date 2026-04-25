import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Hivon Blog — Ideas Worth Reading',
  description: 'A modern blogging platform built with Next.js and Supabase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 64px)', paddingTop: '64px' }}>
          {children}
        </main>
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '2rem 0',
          textAlign: 'center',
          color: 'var(--ink-muted)',
          fontSize: '0.875rem',
          background: 'var(--white)',
          marginTop: '4rem'
        }}>
          <div className="container">
            <p>© {new Date().getFullYear()} Hivon Blog · Built with Next.js & Supabase</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
