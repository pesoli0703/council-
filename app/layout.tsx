import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Council - Board of Directors',
  description: 'Assemble diverse perspectives to make better decisions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
