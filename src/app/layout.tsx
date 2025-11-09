import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { UsageProvider } from "@/contexts/usage-context";
import { FloatingUpgradeCard } from "@/components/ui/floating-upgrade-card";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Tw33t - AI-Powered Tweet Generator",
  description: "Generate professional tweets, threads, and replies with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <AuthProvider>
          <UsageProvider>
            {children}
            <FloatingUpgradeCard />
            <Toaster />
          </UsageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
