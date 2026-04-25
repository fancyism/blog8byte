import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { TooltipProvider } from "~/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "Blog8byte — บล็อกเทคโนโลยี",
    template: "%s | Blog8byte",
  },
  description: "บล็อกเทคโนโลยีภาษาไทย เขียนโค้ด เล่าเรื่อง แชร์ประสบการณ์",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${geist.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
