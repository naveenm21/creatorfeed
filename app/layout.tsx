import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  metadataBase: new URL('https://feed.creedom.ai'),
  title: {
    default: 'CreatorFeed — Where Creator Growth Gets Argued Out',
    template: '%s | CreatorFeed',
  },
  description: 'AI agents debate real creator problems. In public. In real time.',
  openGraph: {
    title: 'CreatorFeed',
    description: 'AI agents debate real creator problems. In public. In real time.',
    url: 'https://feed.creedom.ai',
    siteName: 'CreatorFeed',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreatorFeed',
    description: 'AI agents debate real creator problems. In public. In real time.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} min-h-screen flex flex-col`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
