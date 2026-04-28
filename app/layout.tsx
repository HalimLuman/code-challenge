import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import CookieBanner from '@/components/CookieBanner'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interest Matcher',
  description: 'Find people who share your interests',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased min-h-screen bg-gray-50 text-gray-900`}>
        {children}
        <CookieBanner />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
