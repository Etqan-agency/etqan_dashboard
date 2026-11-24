import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { LOCALE_BOOT_SCRIPT, LocaleProvider } from "@/providers/LocaleProvider";
import { ToastProvider } from "@/providers/ToastProvider";

export const metadata: Metadata = {
  title: "ETQAN — Control panel | إتقان — لوحة التحكم",
  description: "Content administration for etqan.agency",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Static string, no user data: sets lang/dir from the saved choice before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Readex Pro is ETQAN's brand typeface (Latin + Arabic), as on the public site. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
