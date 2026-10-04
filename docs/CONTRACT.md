# Contract surface

`contracts/driftglass.py` is the sole authority for product records and enforcement state.

## Writes

`create_draft`, `update_draft`, `cancel_draft`, `activate_baseline`, `propose_revision`, `activate_revision`, `run_checkpoint`, `exercise_right`, and `archive_watch` implement the bounded state machine. Only the creator may edit, revise, cancel, or archive; checkpoints are permissionless. Only the authority-bound beneficiary may call `exercise_right`, and only while the effective right state is fresh and `ENFORCEABLE`.

## Reads

`get_watch`, `get_revisions`, `get_checkpoints`, `get_exercises`, `get_policy_digest`, `get_revision_proposal`, `list_watch_ids`, `list_creator_watch_ids`, and `get_next_watch_id` reconstruct the live product. `get_watch` derives effective expiry, checkpoint eligibility, and stale-right suspension from chain time.

## Intelligent decisions

Baseline activation first verifies the canonical domain's authority manifest, then asks whether its complete official source responses materially support every frozen clause. Checkpoints ask how current meaning relates to the verified revision. The leader returns clause judgments, grounded excerpts, reasons, full-response commitments, and coverage metadata. Validators independently refetch, reject changed commitments or ungrounded excerpts, replay the semantic question, and compare material outcomes. The aggregate verdict deterministically changes the beneficiary right to `ENFORCEABLE`, `SUSPENDED`, or `REVOKED`.

Responses up to 60,000 characters per source and 120,000 in aggregate are considered in full. Empty, failed, or oversized responses have explicit coverage states and fail closed; no prefix is represented as complete evidence.
