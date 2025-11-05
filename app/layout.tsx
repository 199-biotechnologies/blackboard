import type { Metadata } from 'next'
import { Crimson_Text } from 'next/font/google'
import './globals.css'

const crimson = Crimson_Text({
  weight: ['400', '600'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Blackboard',
  description: 'Simple text editor',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={crimson.className}>{children}</body>
    </html>
  )
}
