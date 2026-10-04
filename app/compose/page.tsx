"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ScanText } from "lucide-react";
import { WalletGate } from "@/components/WalletGate";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { useTransaction } from "@/lib/contract/TransactionProvider";
import { listCreatorWatchIds, readWatch, submitCreateDraft } from "@/lib/contract/adapter";

const MIN_INTERVAL = 300;

function ComposeForm() {
  const router = useRouter();
  const wallet = useWallet();
  const transaction = useTransaction();
  const [subject, setSubject] = useState("");
  const [domain, setDomain] = useState("");
  const [sources, setSources] = useState([""]);
  const [clauses, setClauses] = useState([""]);
  const [note, setNote] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [rightLabel, setRightLabel] = useState("");
  const [interval, setIntervalValue] = useState(86400);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const cleanSources = sources.map((value) => value.trim()).filter(Boolean);
    const cleanClauses = clauses.map((value) => value.trim()).filter(Boolean);
    const boundBeneficiary = beneficiary.trim() || wallet.account || "";
    if (!subject.trim() || !domain.trim() || !cleanSources.length || !cleanClauses.length || !rightLabel.trim() || !/^0x[a-fA-F0-9]{40}$/.test(boundBeneficiary)) {
      setError("Subject, domain, sources, clauses, a valid beneficiary, and an enforceable right are required.");
      return;
    }
    if (!wallet.account || !wallet.provider || !wallet.correctNetwork) return;
    let existing: string[] = [];
    try {
      existing = await listCreatorWatchIds(wallet.account);
    } catch {
      existing = [];
    }
    let createdId = "";
    await transaction.run({
      label: "Create watch draft",
      submit: () => submitCreateDraft(wallet.account!, wallet.provider!, {
        subject: subject.trim(),
        canonicalDomain: domain.trim().toLowerCase(),
        sourceUrls: cleanSources,
        clauses: cleanClauses,
        authorityUrl: `https://${domain.trim().toLowerCase().replace(/\.$/, "")}/.well-known/driftglass.json`,
        beneficiary: boundBeneficiary,
        rightLabel: rightLabel.trim(),
        reviewIntervalSeconds: interval,
        note: note.trim(),
      }),
      authoritativeReread: async () => {
        const ids = await listCreatorWatchIds(wallet.account!);
        const newIds = ids.filter((id) => !existing.includes(id));
        createdId = newIds.at(-1) ?? "";
        if (!createdId) return false;
        const record = await readWatch(createdId);
        return record.creator.toLowerCase() === wallet.account!.toLowerCase() && record.lifecycle === "DRAFT";
      },
      onConfirmed: () => router.push(`/record/${createdId}`),
    });
  };

  return (
    <form className="compose-layout" onSubmit={submit}>
      <div className="compose-main">
        <section className="form-sheet">
          <span className="sheet-number">01</span>
          <div><span className="eyebrow">Authority-bound guarantee</span><h2>Name the public policy</h2><p>Activation requires a matching manifest hosted by this domain. A wallet assertion alone cannot establish authority.</p></div>
          <label>Subject name<input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} placeholder="Example API service" /></label>
          <label>Canonical domain<input value={domain} onChange={(event) => setDomain(event.target.value)} maxLength={253} placeholder="example.com" /><small>Enter a hostname, not a URL. Subdomains of this domain may be used below.</small></label>
          <label>Beneficiary wallet<input value={beneficiary} onChange={(event) => setBeneficiary(event.target.value)} maxLength={42} placeholder={wallet.account ?? "0x…"} /><small>Leave blank to bind your connected wallet.</small></label>
          <label>Enforceable right<input value={rightLabel} onChange={(event) => setRightLabel(event.target.value)} maxLength={160} placeholder="Exercise the verified data-export right" /><small>Consensus will gate this right onchain.</small></label>
        </section>

        <section className="form-sheet">
          <span className="sheet-number">02</span>
          <div><span className="eyebrow">Frozen evidence boundary</span><h2>Add authoritative pages</h2><p>Every source must use HTTPS and belong to the canonical domain. Missing sources fail closed.</p></div>
          {sources.map((source, index) => <div className="repeat-field" key={index}><label>Source {index + 1}<input type="url" value={source} onChange={(event) => setSources((values) => values.map((value, i) => i === index ? event.target.value : value))} maxLength={512} placeholder="https://docs.example.com/policy" /></label>{sources.length > 1 ? <button type="button" className="icon-button" aria-label={`Remove source ${index + 1}`} onClick={() => setSources((values) => values.filter((_, i) => i !== index))}><Minus /></button> : null}</div>)}
          {sources.length < 4 ? <button type="button" className="add-line" onClick={() => setSources((values) => [...values, ""])}><Plus size={17} /> Add source</button> : null}
        </section>

        <section className="form-sheet">
          <span className="sheet-number">03</span>
          <div><span className="eyebrow">Reliance baseline</span><h2>Write precise clauses</h2><p>Each clause should express one protection or commitment that can be compared against current official text.</p></div>
          {clauses.map((clause, index) => <div className="repeat-field align-start" key={index}><label>Clause {index + 1}<textarea value={clause} onChange={(event) => setClauses((values) => values.map((value, i) => i === index ? event.target.value : value))} maxLength={500} rows={3} placeholder="The service will provide at least 90 days' notice before removing a public API version." /><small>{clause.length}/500</small></label>{clauses.length > 1 ? <button type="button" className="icon-button" aria-label={`Remove clause ${index + 1}`} onClick={() => setClauses((values) => values.filter((_, i) => i !== index))}><Minus /></button> : null}</div>)}
          {clauses.length < 5 ? <button type="button" className="add-line" onClick={() => setClauses((values) => [...values, ""])}><Plus size={17} /> Add clause</button> : null}
        </section>

        <section className="form-sheet">
          <span className="sheet-number">04</span>
          <div><span className="eyebrow">Review rhythm</span><h2>Define freshness</h2><p>Driftglass does not run a centralized scheduler. A visitor must initiate each eligible checkpoint.</p></div>
          <label>Checkpoint interval<select value={interval} onChange={(event) => setIntervalValue(Number(event.target.value))}><option value={MIN_INTERVAL}>5 minutes — live demonstration</option><option value={86400}>1 day</option><option value={604800}>1 week</option><option value={2592000}>30 days</option></select></label>
          <label>Why this matters<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Our integration planning relies on this notice period." /><small>{note.length}/500</small></label>
        </section>
      </div>
      <aside className="compose-review">
        <ScanText />
        <span className="eyebrow">Before the wallet opens</span>
        <h3>This transaction creates a draft—not an enforceable guarantee.</h3>
        <ol><li>Contract stores the exact policy digest.</li><li>You publish the generated manifest at <code>/.well-known/driftglass.json</code>.</li><li>Validators verify domain authority and every clause before enabling the right.</li></ol>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button button-rust full" disabled={transaction.busy}>Create draft</button>
      </aside>
    </form>
  );
}

export default function ComposePage() {
  return <div className="page-shell page-top"><div className="page-intro"><span className="eyebrow">New policy guarantee</span><h1>Bind a public promise to an enforceable right.</h1><p>Domain authority, exact evidence, and the beneficiary are independently verified before enforcement.</p></div><WalletGate><ComposeForm /></WalletGate></div>;
}
