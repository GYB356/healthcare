import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-toastify';
import { AuthProvider } from '@/contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/globals.css';
import Navigation from '../components/Navigation'

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
          <Navigation />
          <main className="min-h-screen p-4 md:p-8">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}