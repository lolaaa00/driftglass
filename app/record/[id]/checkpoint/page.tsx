"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WalletGate } from "@/components/WalletGate";
import { readCheckpoints, readWatch, submitCheckpoint } from "@/lib/contract/adapter";
import type { WatchRecord } from "@/lib/contract/types";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { useTransaction } from "@/lib/contract/TransactionProvider";

export default function CheckpointPage() {
  const { id } = useParams<{ id: string }>();
  const wallet = useWallet();
  const transaction = useTransaction();
  const [watch, setWatch] = useState<WatchRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void readWatch(id).then(setWatch).catch((cause) => setError((cause as Error).message)); }, [id]);
  if (error) return <div className="page-shell page-top"><div className="empty-sheet error-sheet"><h1>Checkpoint unavailable</h1><p>{error}</p></div></div>;
  if (!watch) return <div className="page-shell page-top"><div className="empty-sheet">Reading active baseline…</div></div>;
  const eligible = watch.checkpoint_eligible;
  const run = () => transaction.run({
    label: `Checkpoint record #${watch.id}`,
    submit: () => submitCheckpoint(wallet.account!, wallet.provider!, watch.id),
    authoritativeReread: async () => {
      const [after, history] = await Promise.all([readWatch(watch.id), readCheckpoints(watch.id)]);
      return after.checkpoint_count === watch.checkpoint_count + 1 && history.at(-1)?.revision === watch.active_revision;
    },
    onConfirmed: () => window.location.assign(`/record/${watch.id}`),
  });
  return <div className="page-shell page-top checkpoint-page"><Link className="back-link" href={`/record/${watch.id}`}><ArrowLeft size={16} /> Back to record</Link><div className="page-intro"><span className="eyebrow">Permissionless checkpoint · record #{watch.id}</span><h1>Compare today&apos;s evidence with revision {watch.active_revision}.</h1><p>Validators will fetch every frozen source independently. This page does not submit evidence or suggest an outcome.</p></div><section className="checkpoint-review"><div><span className="eyebrow">Subject</span><h2>{watch.subject}</h2><p>{watch.canonical_domain}</p></div><div><span className="eyebrow">Frozen clauses</span><ol>{watch.clauses.map((clause) => <li key={clause}>{clause}</li>)}</ol></div><div><span className="eyebrow">Sources validators will fetch</span><ul>{watch.source_urls.map((source) => <li key={source}><a href={source} target="_blank" rel="noreferrer">{source} <ExternalLink size={13} /></a></li>)}</ul></div></section><WalletGate><div className="checkpoint-submit"><div><span className="eyebrow">Consensus write</span><h3>{eligible ? "Checkpoint is eligible" : "Checkpoint interval has not elapsed"}</h3><p>Success appears only after finalization, majority agreement, successful execution and a contract-state reread.</p></div><button className="button button-rust" onClick={() => void run()} disabled={!eligible || transaction.busy}><RefreshCw size={17} /> Run semantic checkpoint</button></div></WalletGate></div>;
}
