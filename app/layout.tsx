import type { Metadata } from "next";
import { Crimson_Text } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const crimsonText = Crimson_Text({
  variable: "--font-crimson-text",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Conv",
  description: "F*ck ecosystems!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${crimsonText.variable} antialiased h-screen font-serif`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}