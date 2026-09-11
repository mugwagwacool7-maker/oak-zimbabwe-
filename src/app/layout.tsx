import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  title: 'OAK Foundation · Partner Convening 2026',
  description: 'Register for the OAK Foundation Partner Convening in Harare, Zimbabwe.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${plusJakarta.className} ${plusJakarta.variable}`}>{children}</body></html>
}
