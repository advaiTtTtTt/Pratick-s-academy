import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "Pratick's Academy — Online Learning Platform",
  description: "Access recorded lectures and live sessions for Pratick's Academy. Browse subjects, watch video lectures, and join live classes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pratick's Academy",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
