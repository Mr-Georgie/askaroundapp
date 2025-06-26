import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthProvider";
import SageFAB from "@/components/SageFAB";

export const metadata: Metadata = {
  title: "AskAroundApp",
  description: "Your friendly neighborhood Q&A app.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1 px-4 py-6 pt-20 pb-24">{children}</main>
              <SageFAB />
              <BottomNav />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
