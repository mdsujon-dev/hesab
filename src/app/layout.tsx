import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ServiceWorkerRegistrar } from "@/components/service-worker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hesab — Income & Expense Manager",
    template: "%s · Hesab",
  },
  description:
    "Offline-first personal accounting: track income and expenses, analyse months and years, and sync automatically when you are back online.",
  applicationName: "Hesab",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hesab",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Lets the layout paint into the notch area on installed PWAs.
  viewportFit: "cover",
  // Light-only app, so one colour for the browser/OS chrome.
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeScript />
        <ServiceWorkerRegistrar />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
