import "./globals.css";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-main",
});

export const metadata = {
  title: "B2B Sales Tool",
  description: "Mobile-first portal for dealers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} font-[var(--font-main)]`}>{children}</body>
    </html>
  );
}
