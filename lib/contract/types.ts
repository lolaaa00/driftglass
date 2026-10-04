export type Lifecycle = "DRAFT" | "ACTIVE" | "CANCELLED" | "ARCHIVED";
export type Assessment = "UNCHECKED" | "STABLE" | "REVIEW_REQUIRED" | "BROKEN" | "SOURCE_UNAVAILABLE" | "INCONCLUSIVE";
export type ClauseVerdict = "PRESERVED" | "NARROWED" | "REMOVED" | "CONTRADICTED" | "SOURCE_UNAVAILABLE" | "INCONCLUSIVE";

export interface SourceCommitment {
  source_index: number;
  url: string;
  content_sha256: string;
  content_length: number;
  http_status: number;
  coverage: "FULL" | "HTTP_ERROR" | "EMPTY" | "TOO_LARGE" | "FETCH_ERROR";
}

export type RightStatus = "PENDING" | "ENFORCEABLE" | "SUSPENDED" | "REVOKED" | "CLOSED";

export interface AuthorityAttestation {
  verified: boolean;
  reason: string;
  commitment: Omit<SourceCommitment, "source_index">;
}

export interface WatchRecord {
  id: string;
  creator: string;
  subject: string;
  canonical_domain: string;
  source_urls: string[];
  clauses: string[];
  authority_url: string;
  authority_verified: boolean;
  beneficiary: string;
  right_label: string;
  right_status: RightStatus;
  effective_right_status: RightStatus;
  exercise_count: number;
  review_interval_seconds: number;
  note: string;
  lifecycle: Lifecycle;
  assessment: Assessment;
  effective_assessment: Assessment | "EXPIRED";
  checkpoint_eligible: boolean;
  active_revision: number;
  checkpoint_count: number;
  created_at: number;
  activated_at: number;
  last_checkpoint_at: number;
  last_successful_at: number;
  fresh_until: number;
  last_activation_result: BaselineResult | null;
}

export interface BaselineClauseResult {
  index: number;
  supported: boolean;
  source_index: number;
  excerpt: string;
}

export interface BaselineResult {
  outcome: "VERIFIED" | "AUTHORITY_UNVERIFIED" | "CLAUSE_NOT_SUPPORTED" | "WRONG_SUBJECT" | "SOURCE_UNAVAILABLE" | "INCONCLUSIVE";
  clauses: BaselineClauseResult[];
  reason: string;
  sources: SourceCommitment[];
  authority: AuthorityAttestation;
}

export interface RightExercise {
  sequence: number;
  watch_id: string;
  revision: number;
  action_digest: string;
  right_label: string;
  beneficiary: string;
  at: number;
  checkpoint_sequence: number;
}

export interface CheckpointClauseResult {
  index: number;
  verdict: ClauseVerdict;
  source_index: number;
  excerpt: string;
  reason: string;
}

export interface Checkpoint {
  sequence: number;
  revision: number;
  at: number;
  assessment: Assessment;
  result: { outcome: Assessment; clauses: CheckpointClauseResult[]; reason: string; sources: SourceCommitment[] };
  digest: string;
  requested_by: string;
}

export interface Revision {
  number: number;
  digest: string;
  subject: string;
  canonical_domain: string;
  source_urls: string[];
  clauses: string[];
  review_interval_seconds: number;
  verified_at: number;
  verification: BaselineResult;
  note?: string;
}

export interface DraftInput {
  subject: string;
  canonicalDomain: string;
  sourceUrls: string[];
  clauses: string[];
  authorityUrl: string;
  beneficiary: string;
  rightLabel: string;
  reviewIntervalSeconds: number;
  note: string;
}
