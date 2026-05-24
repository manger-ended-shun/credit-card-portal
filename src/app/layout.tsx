import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
 
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
