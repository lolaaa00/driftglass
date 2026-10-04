import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { WalletProvider } from "@/lib/wallet/WalletProvider";
import { TransactionProvider } from "@/lib/contract/TransactionProvider";

export const metadata: Metadata = {
  title: "Driftglass — Consensus-enforced semantic guarantees",
  description: "Authority-bound public promises with beneficiary rights enforced by GenLayer consensus.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <TransactionProvider>
            <SiteHeader />
            <main>{children}</main>
          </TransactionProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
