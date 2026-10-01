# Driftglass

Driftglass is a public semantic-change ledger for promises published on official websites. An observer freezes named HTTPS sources and precise reliance clauses; GenLayer validators independently verify the baseline and later determine whether its meaning was preserved, narrowed, removed, contradicted, unavailable, or inconclusive.

## Why GenLayer

A content hash can prove bytes changed, but not whether a policy's practical meaning changed. Driftglass puts that substantive judgment inside GenLayer consensus. The browser never decides an outcome and there is no project-controlled oracle or backend.

## Architecture

- Next.js App Router frontend with an injected EIP-1193 wallet.
- One Intelligent Contract, `Driftglass`, owning drafts, verified revisions, checkpoints, source commitments, and terminal states.
- No database, API server, signer service, scheduler, or authoritative browser storage.

The contract is the source of truth. Refreshing the application reconstructs records from contract reads.

## Lifecycle

1. Create a draft with a subject, canonical domain, one to four official URLs, one to five clauses, and a review interval.
2. Activate it only after validators independently fetch the sources and verify every clause.
3. Let any account initiate an eligible checkpoint.
4. Read clause-level evidence, reasons, SHA-256 source commitments, revision, requester, and chain timestamp.
5. The creator may stage and verify an immutable revision or archive the record; no administrator can rewrite consensus history.

Missing or conflicting evidence fails closed as `SOURCE_UNAVAILABLE` or `INCONCLUSIVE`. `EXPIRED` and checkpoint eligibility are derived from chain time.

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

The UI reports a write as successful only after `FINALIZED`, `MAJORITY_AGREE`, `FINISHED_WITH_RETURN`, and an authoritative state reread. Submission or `ACCEPTED` alone is never success.

## Deployment

```bash
npm exec -- genlayer network set studionet
npm exec -- genlayer network info
npm exec -- genlayer deploy --contract contracts/driftglass.py --rpc https://studio.genlayer.com/api
```

Use a funded deployer without committing private keys. Ordinary product writes always use the visitor's injected wallet.

## Security and limitations

- Sources must be HTTPS pages on the frozen canonical domain; fragments, credentials, IP literals, and local hosts are rejected.
- Validators refetch evidence, compare URL-bound content commitments, and reject ungrounded excerpts.
- Inputs, fetch size, and history are bounded; duplicate digests and invalid transitions are rejected.
- The creator controls draft edits, revisions, and archival, but cannot rewrite verified outcomes.
- Validators must be able to access the public source. Login walls and bot protection produce fail-closed outcomes.
- Users initiate checkpoints; there is deliberately no centralized scheduler.

Verified release facts are recorded in [`docs/RELEASE.md`](docs/RELEASE.md).
