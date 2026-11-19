import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Biology Drill — Practice deeper",
  description: "Rigorous biology practice for curious, ambitious students.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
