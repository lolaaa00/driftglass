"use client";

import { Network, WalletCards } from "lucide-react";
import { useWallet } from "@/lib/wallet/WalletProvider";

export function WalletGate({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  if (!wallet.connected) {
    return <div className="notice-sheet"><WalletCards /><div><h3>Wallet required</h3><p>Connect an injected EVM wallet to continue. Browsing public records never requires a wallet.</p><button className="button button-ink" onClick={() => void wallet.connect()}>Connect wallet</button></div></div>;
  }
  if (!wallet.correctNetwork) {
    return <div className="notice-sheet warning"><Network /><div><h3>Wrong network</h3><p>This action exists only on GenLayer Studionet, chain 61999.</p><button className="button button-ink" onClick={() => void wallet.switchToStudionet()}>Switch network</button></div></div>;
  }
  return children;
}
