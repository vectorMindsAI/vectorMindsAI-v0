import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { AnalyticsProvider } from "@/components/analytics-provider-wrapper"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"
// Import Sentry client config to initialize it
import "../sentry.client.config"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI City Research Agent — v0",
  description: "Multi-Step Enrichment Engine for comprehensive city research",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ErrorBoundary level="app">
          <AuthProvider>
            <AnalyticsProvider>
              {children}
              <Analytics />
            </AnalyticsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
