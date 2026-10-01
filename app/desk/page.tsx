"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { WalletGate } from "@/components/WalletGate";
import { RecordSummary } from "@/components/RecordSummary";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { listCreatorWatchIds, readWatch } from "@/lib/contract/adapter";
import type { WatchRecord } from "@/lib/contract/types";

function DeskRecords() {
  const { account } = useWallet();
  const [records, setRecords] = useState<WatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!account) return;
    void listCreatorWatchIds(account)
      .then((ids) => Promise.all(ids.slice().reverse().map(readWatch)))
      .then(setRecords)
      .catch((cause) => setError((cause as Error).message))
      .finally(() => setLoading(false));
  }, [account]);
  if (loading) return <div className="empty-sheet"><p>Reconstructing your desk from contract state…</p></div>;
  if (error) return <div className="empty-sheet error-sheet"><h3>Could not read your desk</h3><p>{error}</p></div>;
  if (!records.length) return <div className="empty-sheet"><h3>No records belong to this wallet</h3><p>Your desk is reconstructed from the contract. Create your first observer record to begin.</p><Link className="button button-ink" href="/compose"><Plus size={17} /> Start a watch</Link></div>;
  return <div className="desk-list">{records.map((watch) => <RecordSummary key={watch.id} watch={watch} />)}</div>;
}

export default function DeskPage() {
  const { account } = useWallet();
  return <div className="page-shell page-top"><div className="page-intro side-by-side"><div><span className="eyebrow">My Desk</span><h1>Records created by this wallet.</h1><p>Drafts, active watches and archived histories are read directly from Studionet.</p></div><Link className="button button-rust" href="/compose"><Plus size={17} /> Start a watch</Link></div><WalletGate><DeskRecords key={account} /></WalletGate></div>;
}
