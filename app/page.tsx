"use client";

import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Split, TimerReset } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listWatchIds, readWatch } from "@/lib/contract/adapter";
import type { WatchRecord } from "@/lib/contract/types";
import { RecordSummary } from "@/components/RecordSummary";
import { DRIFTGLASS_CONTRACT_ADDRESS } from "@/lib/contract/address";

export default function HomePage() {
  const router = useRouter();
  const [records, setRecords] = useState<WatchRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(Boolean(DRIFTGLASS_CONTRACT_ADDRESS));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!DRIFTGLASS_CONTRACT_ADDRESS) return;
    void listWatchIds(0, 12)
      .then((ids) => Promise.all(ids.slice().reverse().map(readWatch)))
      .then(setRecords)
      .catch((cause) => setError((cause as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (/^\d+$/.test(value)) router.push(`/record/${value}`);
    else {
      const match = records.find((record) => record.canonical_domain.includes(value.toLowerCase()) || record.subject.toLowerCase().includes(value.toLowerCase()));
      if (match) router.push(`/record/${match.id}`);
      else setError("No loaded record matches that ID, domain, or subject.");
    }
  };

  return (
    <>
      <section className="hero page-shell">
        <div className="hero-copy">
          <span className="eyebrow">Authority-bound promises, enforced over time</span>
          <h1>When the words stay familiar but the <em>meaning moves.</em></h1>
          <p>Bind a beneficiary right to an official policy. GenLayer validators independently verify the domain and evidence, then enforce whether that right may be exercised.</p>
          <div className="hero-actions"><Link className="button button-rust" href="/compose">Start a watch <ArrowRight size={18} /></Link><Link className="text-link" href="/method">Read the method</Link></div>
        </div>
        <div className="hero-note">
          <span className="note-index">FIELD NOTE 01</span>
          <p>A text diff can tell you that words changed. It cannot tell you whether a new exception weakened the protection you relied on.</p>
          <div className="annotation">Domain-authorized · validator-judged · contract-enforced</div>
        </div>
      </section>

      <section className="search-band">
        <div className="page-shell">
          <form onSubmit={search} className="record-search">
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a record by ID, domain, or subject" aria-label="Search records" />
            <button>Open record</button>
          </form>
          {error ? <p className="form-error">{error}</p> : null}
        </div>
      </section>

      <section className="page-shell principle-strip">
        <div><ShieldCheck /><strong>Verified authority</strong><span>The domain manifest and every clause must match before activation.</span></div>
        <div><Split /><strong>Clause-level judgment</strong><span>Preserved, narrowed, removed, contradicted, or unresolved.</span></div>
        <div><TimerReset /><strong>Enforced right</strong><span>Only a fresh, consensus-approved beneficiary right can be exercised.</span></div>
      </section>

      <section className="page-shell records-section">
        <div className="section-heading"><div><span className="eyebrow">Public ledger</span><h2>Recent checkpoints</h2></div><Link href="/desk">Your records <ArrowRight size={16} /></Link></div>
        {!DRIFTGLASS_CONTRACT_ADDRESS ? <div className="empty-sheet"><h3>Deployment pending</h3><p>The product is built, but this checkout has not yet been wired to a Studionet deployment. No sample history is shown as live data.</p></div> : loading ? <div className="empty-sheet"><p>Reading contract records…</p></div> : records.length ? records.map((watch) => <RecordSummary key={watch.id} watch={watch} />) : <div className="empty-sheet"><h3>The ledger is empty</h3><p>Be the first issuer to establish an authority-bound semantic guarantee.</p><Link className="button button-ink" href="/compose">Create a guarantee</Link></div>}
      </section>
    </>
  );
}
