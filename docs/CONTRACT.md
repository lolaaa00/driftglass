# Contract surface

`contracts/driftglass.py` is the sole authority for product records.

## Writes

`create_draft`, `update_draft`, `cancel_draft`, `activate_baseline`, `propose_revision`, `activate_revision`, `run_checkpoint`, and `archive_watch` implement the bounded state machine. Only the creator may edit, revise, cancel, or archive; checkpoints are permissionless.

## Reads

`get_watch`, `get_revisions`, `get_checkpoints`, `get_revision_proposal`, `list_watch_ids`, `list_creator_watch_ids`, and `get_next_watch_id` reconstruct the live product. `get_watch` derives effective expiry and checkpoint eligibility from chain time.

## Intelligent decisions

Baseline activation asks whether official sources materially support every frozen clause. Checkpoints ask how current meaning relates to the verified revision. The leader returns clause judgments, grounded excerpts, reasons, and source commitments. Validators independently refetch, reject changed commitments or ungrounded excerpts, replay the semantic question, and compare material outcomes.
