"use client";

import Link from "next/link";
import { BookOpenText, CircleUserRound, Menu, Network, X } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { STUDIONET } from "@/lib/genlayer/network";
import { TransactionRibbon } from "./TransactionRibbon";

const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export function SiteHeader() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
          <span className="mark" aria-hidden="true">D</span>
          <span>Driftglass<small>semantic change ledger</small></span>
        </Link>
        <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "nav-open" : ""}>
          <Link href="/">Explore</Link>
          <Link href="/desk">My Desk</Link>
          <Link href="/compose">Start a Watch</Link>
          <Link href="/method"><BookOpenText size={16} /> Method</Link>
        </nav>
        <div className="wallet-cluster">
          {wallet.connected && !wallet.correctNetwork ? (
            <button className="network-warning" onClick={() => void wallet.switchToStudionet()}>
              <Network size={15} /> Switch to {STUDIONET.name}
            </button>
          ) : null}
          {wallet.connected ? (
            <div className="account-pill">
              <CircleUserRound size={16} /> {short(wallet.account!)}
              <button onClick={wallet.disconnect}>Disconnect</button>
            </div>
          ) : (
            <button className="button button-ink compact" onClick={() => void wallet.connect()}>Connect wallet</button>
          )}
        </div>
      </header>
      {wallet.error ? <div className="wallet-error">{wallet.error}</div> : null}
      <TransactionRibbon />
    </>
  );
}
