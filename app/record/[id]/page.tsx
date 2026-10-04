"use client";

import Link from "next/link";
import { Archive, ArrowRight, ExternalLink, FileClock, Fingerprint, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { StatusSeal, effectiveAssessment } from "@/components/StatusSeal";
import { WalletGate } from "@/components/WalletGate";
import {
  readCheckpoints,
  readExercises,
  readPolicyDigest,
  readRevisionProposal,
  readRevisions,
  readWatch,
  submitActivateBaseline,
  submitActivateRevision,
  submitArchive,
  submitExerciseRight,
  submitProposeRevision,
} from "@/lib/contract/adapter";
import type { Checkpoint, Revision, RightExercise, WatchRecord } from "@/lib/contract/types";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { useTransaction } from "@/lib/contract/TransactionProvider";

const date = (seconds: number) => seconds ? new Date(seconds * 1000).toLocaleString() : "Not yet";
const short = (value: string) => `${value.slice(0, 8)}…${value.slice(-6)}`;

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function ExerciseForm({ watch, exercises, reload }: { watch: WatchRecord; exercises: RightExercise[]; reload: () => Promise<void> }) {
  const wallet = useWallet();
  const transaction = useTransaction();
  const [action, setAction] = useState("");
  const beneficiary = wallet.account?.toLowerCase() === watch.beneficiary.toLowerCase();
  if (!beneficiary || watch.effective_right_status !== "ENFORCEABLE") return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!action.trim()) return;
    const digest = await sha256(action.trim());
    const before = exercises.length;
    await transaction.run({
      label: "Exercise consensus-controlled right",
      submit: () => submitExerciseRight(wallet.account!, wallet.provider!, watch.id, digest),
      authoritativeReread: async () => (await readExercises(watch.id)).length === before + 1,
      onConfirmed: () => { setAction(""); void reload(); },
    });
  };
  return <form className="revision-form" onSubmit={(event) => void submit(event)}><span className="eyebrow">Enforcement gate</span><h3>Exercise this verified right</h3><p>The contract accepts this action only while validator consensus keeps the authority-bound guarantee enforceable.</p><label>Action reference<textarea value={action} onChange={(event) => setAction(event.target.value)} required maxLength={500} rows={3} placeholder="Describe or reference the action being authorized." /></label><button className="button button-ink" disabled={transaction.busy}><KeyRound size={16} /> Exercise right</button></form>;
}

function RecordActions({ watch, reload, proposal }: { watch: WatchRecord; reload: () => Promise<void>; proposal: Record<string, unknown> }) {
  const wallet = useWallet();
  const transaction = useTransaction();
  const owner = wallet.account?.toLowerCase() === watch.creator.toLowerCase();
  const activationResultBefore = JSON.stringify(watch.last_activation_result);
  const runActivation = () => transaction.run({
    label: "Verify baseline",
    submit: () => submitActivateBaseline(wallet.account!, wallet.provider!, watch.id),
    authoritativeReread: async () => {
      const after = await readWatch(watch.id);
      return after.lifecycle === "ACTIVE" || JSON.stringify(after.last_activation_result) !== activationResultBefore;
    },
    onConfirmed: () => void reload(),
  });
  const runArchive = () => transaction.run({
    label: "Archive watch",
    submit: () => submitArchive(wallet.account!, wallet.provider!, watch.id),
    authoritativeReread: async () => (await readWatch(watch.id)).lifecycle === "ARCHIVED",
    onConfirmed: () => void reload(),
  });
  const activateRevision = () => transaction.run({
    label: "Verify baseline revision",
    submit: () => submitActivateRevision(wallet.account!, wallet.provider!, watch.id),
    authoritativeReread: async () => {
      const after = await readWatch(watch.id);
      const nextProposal = await readRevisionProposal(watch.id);
      return after.active_revision > watch.active_revision || JSON.stringify(nextProposal) !== JSON.stringify(proposal);
    },
    onConfirmed: () => void reload(),
  });
  if (!owner && watch.lifecycle !== "ACTIVE") return null;
  return <WalletGate><div className="action-sheet"><div><span className="eyebrow">Valid next actions</span><h3>{watch.lifecycle === "DRAFT" ? "Ask validators to verify this baseline" : watch.lifecycle === "ACTIVE" ? "Extend this public record" : "This record is historical"}</h3></div><div className="action-buttons">
    {owner && watch.lifecycle === "DRAFT" ? <button className="button button-rust" onClick={() => void runActivation()} disabled={transaction.busy}><ShieldCheck size={17} /> Verify baseline</button> : null}
    {watch.lifecycle === "ACTIVE" ? <Link className="button button-rust" href={`/record/${watch.id}/checkpoint`}><RefreshCw size={17} /> Run checkpoint</Link> : null}
    {owner && watch.lifecycle === "ACTIVE" && Object.keys(proposal).length > 0 ? <button className="button button-ink" onClick={() => void activateRevision()} disabled={transaction.busy}>Verify proposed revision</button> : null}
    {owner && watch.lifecycle === "ACTIVE" ? <button className="button button-quiet" onClick={() => void runArchive()} disabled={transaction.busy}><Archive size={17} /> Archive</button> : null}
  </div></div></WalletGate>;
}

function RevisionForm({ watch, reload }: { watch: WatchRecord; reload: () => Promise<void> }) {
  const wallet = useWallet();
  const transaction = useTransaction();
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState(watch.source_urls.join("\n"));
  const [clauses, setClauses] = useState(watch.clauses.join("\n\n"));
  const [note, setNote] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const sourceUrls = sources.split("\n").map((value) => value.trim()).filter(Boolean);
    const nextClauses = clauses.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean);
    void transaction.run({
      label: "Propose baseline revision",
      submit: () => submitProposeRevision(wallet.account!, wallet.provider!, watch.id, { sourceUrls, clauses: nextClauses, reviewIntervalSeconds: watch.review_interval_seconds, note }),
      authoritativeReread: async () => Object.keys(await readRevisionProposal(watch.id)).length > 0,
      onConfirmed: () => { setOpen(false); void reload(); },
    });
  };
  if (!open) return <button className="text-link" onClick={() => setOpen(true)}>Propose a new verified baseline <ArrowRight size={15} /></button>;
  return <form className="revision-form" onSubmit={submit}><span className="eyebrow">Immutable revision</span><h3>Propose replacement evidence and clauses</h3><p>The current history will remain intact. The proposal cannot become active until validators independently verify it.</p><label>Sources, one URL per line<textarea value={sources} onChange={(event) => setSources(event.target.value)} rows={4} /></label><label>Clauses, separated by a blank line<textarea value={clauses} onChange={(event) => setClauses(event.target.value)} rows={7} /></label><label>Reason for revision<textarea value={note} onChange={(event) => setNote(event.target.value)} required maxLength={500} rows={3} /></label><div className="inline-actions"><button className="button button-rust" disabled={transaction.busy}>Store proposal</button><button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button></div></form>;
}

export default function RecordPage() {
  const { id } = useParams<{ id: string }>();
  const wallet = useWallet();
  const [watch, setWatch] = useState<WatchRecord | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [exercises, setExercises] = useState<RightExercise[]>([]);
  const [policyDigest, setPolicyDigest] = useState("");
  const [proposal, setProposal] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const [record, revisionList, checkpointList, exerciseList, digest, proposalState] = await Promise.all([readWatch(id), readRevisions(id), readCheckpoints(id), readExercises(id), readPolicyDigest(id), readRevisionProposal(id)]);
      setWatch(record); setRevisions(revisionList); setCheckpoints(checkpointList); setExercises(exerciseList); setPolicyDigest(digest); setProposal(proposalState); setError(null);
    } catch (cause) { setError((cause as Error).message); }
  }, [id]);
  useEffect(() => {
    void Promise.all([readWatch(id), readRevisions(id), readCheckpoints(id), readExercises(id), readPolicyDigest(id), readRevisionProposal(id)])
      .then(([record, revisionList, checkpointList, exerciseList, digest, proposalState]) => {
        setWatch(record);
        setRevisions(revisionList);
        setCheckpoints(checkpointList);
        setExercises(exerciseList);
        setPolicyDigest(digest);
        setProposal(proposalState);
        setError(null);
      })
      .catch((cause) => setError((cause as Error).message));
  }, [id]);
  if (error) return <div className="page-shell page-top"><div className="empty-sheet error-sheet"><h1>Record unavailable</h1><p>{error}</p><Link href="/">Return to Explore</Link></div></div>;
  if (!watch) return <div className="page-shell page-top"><div className="empty-sheet">Reading record #{id} from Studionet…</div></div>;
  const owner = wallet.account?.toLowerCase() === watch.creator.toLowerCase();
  const assessment = watch.lifecycle === "ACTIVE" ? effectiveAssessment(watch) : watch.lifecycle;
  const authorityManifest = JSON.stringify({ schema: "driftglass-authority-v1", canonical_domain: watch.canonical_domain, issuer: watch.creator.toLowerCase(), beneficiary: watch.beneficiary.toLowerCase(), policy_digest: policyDigest }, null, 2);
  return <div className="page-shell page-top record-page">
    <header className="record-header"><div><span className="eyebrow">Public record #{watch.id}</span><h1>{watch.subject}</h1><a href={`https://${watch.canonical_domain}`} target="_blank" rel="noreferrer">{watch.canonical_domain} <ExternalLink size={14} /></a></div><StatusSeal value={assessment} /></header>
    <div className="record-meta"><span><Fingerprint /> Issuer <code title={watch.creator}>{short(watch.creator)}</code>{owner ? " · you" : ""}</span><span><KeyRound /> Right: {watch.effective_right_status.replaceAll("_", " ")}</span><span><FileClock /> Revision {watch.active_revision || "draft"}</span><span>Fresh until {date(watch.fresh_until)}</span></div>
    <RecordActions watch={watch} reload={reload} proposal={proposal} />
    {watch.last_activation_result && watch.lifecycle === "DRAFT" ? <div className={`verdict-callout ${watch.last_activation_result.outcome === "VERIFIED" ? "" : "error-sheet"}`}><span className="eyebrow">Last activation result</span><h2>{watch.last_activation_result.outcome.replaceAll("_", " ")}</h2><p>{watch.last_activation_result.reason}</p></div> : null}
    <section className="record-grid">
      <div className="evidence-column"><div className="section-heading"><div><span className="eyebrow">Frozen meaning</span><h2>Reliance clauses</h2></div></div>{watch.clauses.map((clause, index) => { const latest = checkpoints.at(-1)?.result.clauses.find((item) => item.index === index); return <article className="clause-sheet" key={index}><span className="clause-index">{String(index + 1).padStart(2, "0")}</span><div><p className="baseline-clause">{clause}</p>{latest ? <div className="current-evidence"><StatusSeal value={latest.verdict} /><p>{latest.reason}</p>{latest.excerpt ? <blockquote>“{latest.excerpt}”</blockquote> : <span className="muted">No reliable current excerpt.</span>}</div> : <p className="muted">No checkpoint has compared this clause yet.</p>}</div></article>; })}</div>
      <aside className="sources-column"><span className="eyebrow">Evidence boundary</span><h2>Frozen sources</h2><ol className="source-list">{watch.source_urls.map((source) => <li key={source}><a href={source} target="_blank" rel="noreferrer">{source}<ExternalLink size={13} /></a></li>)}</ol><div className="margin-note"><span>Authority manifest</span><p><a href={watch.authority_url} target="_blank" rel="noreferrer">{watch.authority_url}</a></p><pre>{authorityManifest}</pre></div><div className="margin-note"><span>Bound beneficiary</span><p><code>{watch.beneficiary}</code></p><strong>{watch.right_label}</strong></div>{watch.note ? <div className="margin-note"><span>Issuer note</span><p>{watch.note}</p></div> : null}<ExerciseForm watch={watch} exercises={exercises} reload={reload} />{owner && watch.lifecycle === "ACTIVE" ? <RevisionForm watch={watch} reload={reload} /> : null}{Object.keys(proposal).length ? <div className="margin-note proposal-note"><span>Revision proposal waiting</span><p>Revision {String(proposal.number)} is stored but not active. It must pass validator verification.</p></div> : null}</aside>
    </section>
    <section className="timeline-section"><div className="section-heading"><div><span className="eyebrow">Append-only history</span><h2>Semantic and enforcement timeline</h2></div><span>{checkpoints.length} checkpoints · {revisions.length} revisions · {exercises.length} exercises</span></div><div className="timeline"><div className="timeline-entry"><span className="timeline-dot" /><time>{date(watch.created_at)}</time><div><strong>Guarantee draft recorded</strong><p>Issuer bound the authority manifest, beneficiary, evidence, and enforceable right.</p></div></div>{revisions.flatMap((revision) => [{ type: "revision" as const, at: revision.verified_at, data: revision }, ...checkpoints.filter((checkpoint) => checkpoint.revision === revision.number).map((checkpoint) => ({ type: "checkpoint" as const, at: checkpoint.at, data: checkpoint }))]).sort((a, b) => a.at - b.at).map((entry) => entry.type === "revision" ? <div className="timeline-entry" key={`r-${entry.data.number}`}><span className="timeline-dot" /><time>{date(entry.at)}</time><div><strong>Authority-bound revision {entry.data.number} verified</strong><p>Digest <code>{short(entry.data.digest)}</code></p></div></div> : <div className="timeline-entry" key={`c-${entry.data.sequence}`}><span className="timeline-dot" /><time>{date(entry.at)}</time><div><strong>Checkpoint {entry.data.sequence}: {entry.data.assessment.replaceAll("_", " ")}</strong><p>{entry.data.result.reason}</p><code>{short(entry.data.digest)}</code></div></div>)}{exercises.map((exercise) => <div className="timeline-entry" key={`e-${exercise.sequence}`}><span className="timeline-dot" /><time>{date(exercise.at)}</time><div><strong>Right exercised #{exercise.sequence}</strong><p>{exercise.right_label}</p><code>{short(exercise.action_digest)}</code></div></div>)}</div></section>
  </div>;
}
