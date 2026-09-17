import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { DemoBanner } from "@/components/demo-badge";
import { isDemoMode } from "@/lib/config";

export const metadata: Metadata = {
  title: "Signal — Know when they buy. Before they post.",
  description:
    "Real-time alerts when tracked crypto influencers buy tokens from publicly identified wallets — and when they mention them on X.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-950 text-fg antialiased">
        <div className="bg-grid min-h-screen">
          {isDemoMode() && <DemoBanner />}
          <Nav />
          <main className="mx-auto w-full max-w-7xl px-4 sm:px-6">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
