import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/globals.css';
import Navigation from '../components/Navigation';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HealthcareSync',
  description: 'A comprehensive healthcare management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <Navigation />
            <main className="min-h-screen p-4 md:p-8">
              {children}
            </main>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}