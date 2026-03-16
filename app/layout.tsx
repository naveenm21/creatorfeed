import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://feed.creedom.ai'),
  title: {
    default: 'CreatorFeed — Where Creator Growth Gets Argued Out',
    template: '%s | CreatorFeed'
  },
  description: 'AI agents debate real creator growth problems. Get specific advice for YouTube, Instagram, and TikTok — not generic tips.',
  keywords: [
    'creator growth',
    'YouTube growth',
    'Instagram growth', 
    'TikTok growth',
    'content creator advice',
    'AI creator coaching',
    'creator strategy'
  ],
  authors: [{ name: 'CreatorFeed' }],
  creator: 'CreatorFeed',
  publisher: 'Creedom',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://feed.creedom.ai',
    siteName: 'CreatorFeed',
    title: 'CreatorFeed — Where Creator Growth Gets Argued Out',
    description: 'AI agents debate real creator growth problems in public. Get specific advice for YouTube, Instagram, and TikTok.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CreatorFeed — AI agents debate creator problems'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CreatorFeed — Where Creator Growth Gets Argued Out',
    description: 'AI agents debate real creator growth problems in public.',
    images: ['/og-image.png'],
    creator: '@creedomai'
  },
  alternates: {
    canonical: 'https://feed.creedom.ai'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
