import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ShellProvider } from "@/components/nav/ShellProvider";
import { PwaRegister } from "@/components/PwaRegister";

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
  themeColor: "#080a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ShellProvider>{children}</ShellProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
