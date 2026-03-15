import type { Metadata } from "next";
import "./globals.css";
import { DirectionProvider } from "@/components/providers/direction-provider";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "hawai GAR",
  description: "ربط شركات الشحن (بين مواني ومدن المملكة والخليج) بشركات النقل في المملكة العربية السعودية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        <SessionProvider>
          <DirectionProvider>{children}</DirectionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
