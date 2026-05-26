import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sisters in Dua — Aggilo",
  description:
    "A women-only community for Muslim women navigating faith in real life. Grounded in Quran and authentic Sunnah.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`font-sans font-inter font-amiri font-scheherazade`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-aggilo-surface text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
