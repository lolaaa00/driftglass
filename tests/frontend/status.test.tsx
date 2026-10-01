import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { effectiveAssessment, StatusSeal } from "@/components/StatusSeal";
import type { WatchRecord } from "@/lib/contract/types";

const watch: WatchRecord = {
  id: "1", creator: `0x${"1".repeat(40)}`, subject: "Subject", canonical_domain: "example.org",
  source_urls: ["https://example.org/policy"], clauses: ["A clause"], review_interval_seconds: 300,
  note: "", lifecycle: "ACTIVE", assessment: "STABLE", effective_assessment: "EXPIRED",
  checkpoint_eligible: false, active_revision: 1, checkpoint_count: 1, created_at: 1, activated_at: 2,
  last_checkpoint_at: 100, last_successful_at: 100, fresh_until: 400, last_activation_result: null,
};

describe("truthful status", () => {
  it("uses the chain-derived effective assessment", () => {
    expect(effectiveAssessment(watch)).toBe("EXPIRED");
    expect(watch.assessment).toBe("STABLE");
  });

  it("renders uncertainty explicitly", () => {
    render(<StatusSeal value="INCONCLUSIVE" />);
    expect(screen.getByText("INCONCLUSIVE")).toHaveAttribute("title", expect.stringContaining("could not reliably"));
  });
});
