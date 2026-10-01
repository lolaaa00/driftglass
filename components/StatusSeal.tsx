import type { Assessment, ClauseVerdict, Lifecycle, WatchRecord } from "@/lib/contract/types";

const descriptions: Record<string, string> = {
  DRAFT: "Baseline not yet verified",
  ACTIVE: "Watch accepts public checkpoints",
  CANCELLED: "Draft cancelled by its creator",
  ARCHIVED: "Historical record; no new checkpoints",
  UNCHECKED: "Verified baseline has no current checkpoint",
  STABLE: "All clauses remain materially preserved",
  REVIEW_REQUIRED: "At least one clause has narrowed",
  BROKEN: "A clause was removed or contradicted",
  SOURCE_UNAVAILABLE: "A frozen source could not be evaluated",
  INCONCLUSIVE: "Validators could not reliably classify the evidence",
  EXPIRED: "The last substantive checkpoint is no longer fresh",
  PRESERVED: "Current official evidence preserves this clause",
  NARROWED: "Current official evidence adds a material limitation",
  REMOVED: "Current official evidence no longer supports this clause",
  CONTRADICTED: "Current official evidence materially opposes this clause",
};

export function effectiveAssessment(watch: WatchRecord): Assessment | "EXPIRED" {
  return watch.effective_assessment;
}

export function StatusSeal({ value }: { value: Assessment | Lifecycle | ClauseVerdict | "EXPIRED" }) {
  return <span className={`status-seal status-${value.toLowerCase()}`} title={descriptions[value]}>{value.replaceAll("_", " ")}</span>;
}
