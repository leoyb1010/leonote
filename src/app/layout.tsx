import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ShellProvider } from "@/components/nav/ShellProvider";
import { ClientRuntimeRecovery, PwaRegister } from "@/components/PwaRegister";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

/**
 * Cloudflare Rocket Loader breaks Next.js RSC data-stream scripts by
 * rewriting <script> type attributes to `type="<hash>-text/javascript"`,
 * which causes client-side hydration to completely fail — showing
 * "This page couldn't load. Reload to try again, or go back."
 *
 * The `data-cfasync="false"` attribute on <html> tells Rocket Loader to
 * skip ALL scripts on the page. This is the Cloudflare-documented way
 * to opt out of Rocket Loader per-page.
 * @see https://developers.cloudflare.com/speed/optimization/content/rocket-loader/ignore-javascripts/
 */
const themeInitScript = `
(function() {
  try {
    var storageKey = 'theme';
    var preference = localStorage.getItem(storageKey);
    var isSystem = !preference || preference === 'system';
    var isDark = isSystem
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : preference === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  } catch (_) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export const metadata: Metadata = {
  title: "Leonote",
  description: "安静、可信、理性的个人知识工作台",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Leonote",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f7" },
    { media: "(prefers-color-scheme: dark)", color: "#080a0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script data-cfasync="false" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ShellProvider>{children}</ShellProvider>
        </ThemeProvider>
        <ClientRuntimeRecovery />
        <PwaRegister />
      </body>
    </html>
  );
}
