import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laudato Si' - UMak Campus Growth",
  description: "A real-time collective growth platform for UMak students, faculty, and staff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
