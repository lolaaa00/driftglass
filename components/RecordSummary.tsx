import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import type { WatchRecord } from "@/lib/contract/types";
import { effectiveAssessment, StatusSeal } from "./StatusSeal";

export function RecordSummary({ watch }: { watch: WatchRecord }) {
  return (
    <Link href={`/record/${watch.id}`} className="record-row">
      <div className="record-number">#{watch.id.padStart(3, "0")}</div>
      <div className="record-main">
        <span className="eyebrow">{watch.canonical_domain}</span>
        <h3>{watch.subject}</h3>
        <p>{watch.clauses.length} reliance {watch.clauses.length === 1 ? "clause" : "clauses"} · revision {watch.active_revision || "draft"}</p>
      </div>
      <div className="record-state">
        <StatusSeal value={watch.lifecycle === "ACTIVE" ? effectiveAssessment(watch) : watch.lifecycle} />
        <span><Clock3 size={14} /> {watch.checkpoint_count} checkpoints</span>
      </div>
      <ArrowUpRight className="row-arrow" />
    </Link>
  );
}
