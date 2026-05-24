import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarSpace",
  description: "Student Collaboration Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
