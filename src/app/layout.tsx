import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// 1. Import the Navbar
import { Navbar } from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Credit Card Portal - Compare Indian Credit Cards',
  description: 'Compare credit cards from all Indian banks',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* 2. Added slate background and flex layout */}
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
        
        {/* 3. Inject the Global Navbar */}
        <Navbar />
        
        {/* 4. Wrap the rest of the app in a growing main container */}
        <main className="flex-grow">
          {children}
        </main>
        
      </body>
    </html>
  )
}