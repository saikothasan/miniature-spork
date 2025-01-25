import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Screenshot Tool",
  description: "Capture website screenshots online",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

