import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
