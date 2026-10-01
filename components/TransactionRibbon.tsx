"use client";

import { ExternalLink, X } from "lucide-react";
import { useTransaction } from "@/lib/contract/TransactionProvider";
import { transactionExplorerUrl } from "@/lib/genlayer/explorer";

const LABELS: Record<string, string> = {
  PREPARING: "Preparing contract call",
  AWAITING_SIGNATURE: "Awaiting wallet signature",
  SUBMITTED: "Submitted to Studionet",
  CONSENSUS_PENDING: "Validators are reaching consensus",
  FINALIZED: "Finalized with majority agreement",
  REREADING: "Re-reading authoritative contract state",
  CONFIRMED: "Contract state confirmed",
  USER_REJECTED: "Wallet request rejected",
  CONSENSUS_FAILED: "Consensus did not succeed",
  EXECUTION_FAILED: "Contract execution failed",
  STATE_MISMATCH: "State confirmation failed",
  FAILED: "Transaction failed",
};

export function TransactionRibbon() {
  const { state, clear } = useTransaction();
  if (state.phase === "IDLE") return null;
  const failed = /FAILED|REJECTED|MISMATCH/.test(state.phase);
  return (
    <aside className={`tx-ribbon ${failed ? "tx-error" : ""}`} aria-live="polite">
      <div>
        <span className="eyebrow">{state.label ?? "Transaction"}</span>
        <strong>{LABELS[state.phase]}</strong>
        {state.error ? <p>{state.error}</p> : null}
      </div>
      <div className="tx-actions">
        {state.hash ? <a href={transactionExplorerUrl(state.hash)} target="_blank" rel="noreferrer">Explorer <ExternalLink size={14} /></a> : null}
        <button className="icon-button" aria-label="Dismiss transaction status" onClick={clear}><X size={17} /></button>
      </div>
    </aside>
  );
}
