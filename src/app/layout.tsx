import type { Metadata } from "next";
import "./globals.css";
import { ShellProvider } from "@/components/nav/ShellProvider";

export const metadata: Metadata = {
  title: "Leonote",
  description: "安静、可信、理性的个人知识工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}
