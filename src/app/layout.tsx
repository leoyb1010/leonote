import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leonote",
  description: "一个为个人长期使用而设计的中文笔记与轻知识库产品",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
