import type { Metadata, Viewport } from 'next'
import { DM_Mono, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const dmMono = DM_Mono({ 
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono"
});

const syne = Syne({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-syne"
});

export const metadata: Metadata = {
  title: 'EmotiArt - Emotion to Art Synthesis',
  description: 'Transform your emotions into visual art using AI-powered facial expression and voice analysis',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0d0d0f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmMono.variable} ${syne.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
