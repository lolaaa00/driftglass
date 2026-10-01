import { AlertTriangle, BookOpenCheck, Eye, Scale } from "lucide-react";

export default function MethodPage() {
  return <div className="page-shell page-top method-page">
    <div className="page-intro"><span className="eyebrow">Method and limits</span><h1>A public record of judgment—not a truth machine.</h1><p>Driftglass narrows a difficult question so independent validators can compare a frozen meaning with current public evidence.</p></div>
    <section className="method-grid">
      <article><BookOpenCheck /><span className="eyebrow">1 · Establish</span><h2>Verify the baseline first</h2><p>A creator cannot make a valid record merely by writing a claim. Validators must find material support for every clause in the frozen sources.</p></article>
      <article><Eye /><span className="eyebrow">2 · Observe</span><h2>Fetch evidence independently</h2><p>Each checkpoint evaluates the same source boundary. Page content is untrusted evidence and cannot instruct the validator or redefine outcomes.</p></article>
      <article><Scale /><span className="eyebrow">3 · Compare</span><h2>Classify semantic change</h2><p>Every clause becomes preserved, narrowed, removed, contradicted, unavailable, or inconclusive. The aggregate is deterministic from those results.</p></article>
      <article><AlertTriangle /><span className="eyebrow">4 · Stay honest</span><h2>Uncertainty does not refresh trust</h2><p>Unavailable sources and inconclusive judgment are visible states. They never become stable and never extend the last substantive checkpoint.</p></article>
    </section>
    <section className="limits-sheet"><span className="eyebrow">What this does not prove</span><h2>An observer record is not organizational endorsement or legal advice.</h2><p>The subject does not become authenticated because a wallet names it. A semantic checkpoint concerns the frozen public URLs and exact clauses only. Websites may be incomplete, region-specific, temporarily unavailable, or legally subordinate to another document.</p></section>
  </div>;
}
