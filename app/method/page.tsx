import { AlertTriangle, BookOpenCheck, Eye, Scale } from "lucide-react";

export default function MethodPage() {
  return <div className="page-shell page-top method-page">
    <div className="page-intro"><span className="eyebrow">Method and limits</span><h1>A semantic guarantee with an enforceable consequence.</h1><p>Driftglass binds a domain, policy, beneficiary, and named right so independent validators can compare frozen meaning with current public evidence and control whether that right remains exercisable.</p></div>
    <section className="method-grid">
      <article><BookOpenCheck /><span className="eyebrow">1 · Establish</span><h2>Verify authority and baseline</h2><p>A wallet cannot self-assert authority. Validators require the domain&apos;s matching well-known manifest and material support for every clause.</p></article>
      <article><Eye /><span className="eyebrow">2 · Observe</span><h2>Fetch evidence independently</h2><p>Each checkpoint evaluates the same source boundary. Page content is untrusted evidence and cannot instruct the validator or redefine outcomes.</p></article>
      <article><Scale /><span className="eyebrow">3 · Compare</span><h2>Classify semantic change</h2><p>Every clause becomes preserved, narrowed, removed, contradicted, unavailable, or inconclusive. The aggregate is deterministic from those results.</p></article>
      <article><AlertTriangle /><span className="eyebrow">4 · Enforce</span><h2>The verdict controls the right</h2><p>Stable evidence makes the beneficiary right enforceable. Breakage revokes it; uncertainty, expiry, revision, or archival suspends or closes it.</p></article>
    </section>
    <section className="limits-sheet"><span className="eyebrow">What this does not prove</span><h2>Domain control and consensus are not legal advice.</h2><p>The authority manifest proves control of the canonical publication path and binds the onchain guarantee. A semantic checkpoint concerns only the frozen URLs and exact clauses. Websites may be incomplete, region-specific, temporarily unavailable, or legally subordinate to another document.</p></section>
  </div>;
}
