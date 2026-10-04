# Driftglass

Driftglass is an authority-bound semantic guarantee for promises published on official websites. A domain owner binds named HTTPS sources, precise reliance clauses, and a beneficiary through a well-known manifest; GenLayer validators independently verify the baseline, control whether the beneficiary's right is enforceable, and later determine whether the promise was preserved, narrowed, removed, contradicted, unavailable, or inconclusive.

## Why GenLayer

A content hash can prove bytes changed, but not whether a policy's practical meaning changed. Driftglass puts that substantive judgment inside GenLayer consensus, and the judgment directly gates an onchain right. The browser never decides an outcome and there is no project-controlled oracle or backend.

## Architecture

- Next.js App Router frontend with an injected EIP-1193 wallet.
- One Intelligent Contract, `Driftglass`, owning drafts, authority proofs, verified revisions, checkpoints, source commitments, enforcement state, exercise receipts, and terminal states.
- No database, API server, signer service, scheduler, or authoritative browser storage.

The contract is the source of truth. Refreshing the application reconstructs records from contract reads.

## Lifecycle

1. Create a draft with a subject, canonical domain, beneficiary, named right, one to four official URLs, one to five clauses, and a review interval.
2. Publish the exact authority manifest at `https://<canonical-domain>/.well-known/driftglass.json`.
3. Activate only after validators independently verify that manifest and every frozen clause from the complete source responses.
4. Let any account initiate an eligible checkpoint. Consensus deterministically makes the right enforceable, suspended, or revoked.
5. Let only the bound beneficiary exercise a fresh, enforceable right; the contract rejects duplicates and records an immutable receipt.
6. Read clause-level evidence, coverage metadata, reasons, SHA-256 full-response commitments, enforcement state, requester, and chain timestamp.
7. The creator may stage and verify an immutable revision or archive the record; no administrator can rewrite consensus history.

Missing, oversized, empty, or conflicting evidence fails closed as `SOURCE_UNAVAILABLE` or `INCONCLUSIVE`. `EXPIRED`, checkpoint eligibility, and effective right suspension are derived from chain time.

## Why this is enforcement, not an attestation

The semantic verdict changes what the contract permits. A verified baseline or `STABLE` checkpoint makes the beneficiary's named right `ENFORCEABLE`; `BROKEN` revokes it; unavailable, inconclusive, stale, revised, or archived records suspend or close it. `exercise_right` checks beneficiary identity, freshness, enforcement state, and replay protection before writing a receipt. A neutral observer cannot substitute its own judgment or exercise the right.

## Authority manifest

Creator assertion is insufficient. For every activation, validators fetch the canonical domain's fixed well-known path and require `schema`, `canonical_domain`, `issuer`, `beneficiary`, and `policy_digest` to match the proposed record exactly. The digest commits to the subject, domain, ordered sources and clauses, revision, beneficiary, and right label. A missing or mismatched manifest leaves the draft unverified.

## Complete-response policy

Validators hash and measure each complete response before semantic evaluation. Responses up to 60,000 characters per source and 120,000 characters in aggregate are evaluated without prefix truncation. Larger responses fail closed as `TOO_LARGE` while preserving their full length and SHA-256 commitment. Each source records explicit coverage, HTTP status, content length, and full-response hash; the contract never silently treats a prefix as the whole source.

## Network

| Setting | Value |
|---|---|
| Network | Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Local GenLayer CLI | `0.39.1` |
| Direct Mode SDK release | `v0.2.16` |

No other GenLayer network is configured.

## Setup

```bash
npm install --ignore-scripts
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env.local
```

Set `NEXT_PUBLIC_DRIFTGLASS_CONTRACT_ADDRESS` to the final Studionet address, then run `npm run dev`.

## Verification

```bash
npm run genlayer:version
npm run verify
```

The release gate runs ESLint, TypeScript, frontend tests, Direct Mode tests, static contract checks, the GenVM linter, network and secret scans, and the production build.

The UI reports a write as successful only after `FINALIZED`, `MAJORITY_AGREE`, the leader's successful execution result (`FINISHED_WITH_RETURN` or Studionet's `SUCCESS`), and an authoritative state reread. Idle-validator cancellation errors do not override a successful leader result; mixed results without an identifiable leader fail closed. Submission or `ACCEPTED` alone is never success.

## Deployment

The production frontend is live at [driftglass-lkue406nh-lolaas-projects.vercel.app](https://driftglass-lkue406nh-lolaas-projects.vercel.app/). It reads from the Studionet contract at [`0x808FddD60A7FFd16c7abcCF474A159a7E4B1b4A1`](https://explorer-studio.genlayer.com/address/0x808FddD60A7FFd16c7abcCF474A159a7E4B1b4A1).

```bash
npm exec -- genlayer network set studionet
npm exec -- genlayer network info
npm exec -- genlayer deploy --contract contracts/driftglass.py --rpc https://studio.genlayer.com/api
```

Use a funded deployer without committing private keys. Ordinary product writes always use the visitor's injected wallet.

## Security and limitations

- Sources must be HTTPS pages on the frozen canonical domain; fragments, credentials, IP literals, and local hosts are rejected.
- The canonical domain must publish a matching well-known authority manifest; wallet authorship alone proves nothing.
- Validators process complete bounded responses, record coverage metadata, compare URL-bound commitments, and reject ungrounded excerpts.
- Inputs, fetch size, and history are bounded; duplicate digests and invalid transitions are rejected.
- Consensus controls right enforcement; only the named beneficiary may exercise an enforceable, fresh right, and action digests cannot be replayed.
- The creator controls draft edits, revisions, and archival, but cannot rewrite verified outcomes or exercise another beneficiary's right.
- Validators must be able to access the public source. Login walls and bot protection produce fail-closed outcomes.
- Users initiate checkpoints; there is deliberately no centralized scheduler.

Verified release facts are recorded in [`docs/RELEASE.md`](docs/RELEASE.md).
