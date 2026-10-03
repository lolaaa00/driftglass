import { beforeEach, describe, expect, it, vi } from "vitest";

const waitForTransactionReceipt = vi.fn();
vi.mock("@/lib/genlayer/client", () => ({ createReadClient: () => ({ waitForTransactionReceipt }) }));

import { consensusDecision, executionDecision, isSuccessfulExecution, waitForSuccessfulFinality } from "@/lib/contract/finality";

describe("GenLayer finality", () => {
  beforeEach(() => waitForTransactionReceipt.mockReset());

  it("accepts only finalized majority agreement with successful execution", async () => {
    const receipt = { statusName: "FINALIZED", resultName: "MAJORITY_AGREE", txExecutionResultName: "FINISHED_WITH_RETURN" };
    waitForTransactionReceipt.mockResolvedValue(receipt);
    expect(consensusDecision(receipt)).toBe("MAJORITY_AGREE");
    expect(executionDecision(receipt)).toBe("FINISHED_WITH_RETURN");
    await expect(waitForSuccessfulFinality(`0x${"1".repeat(64)}`)).resolves.toMatchObject({ ok: true });
  });

  it("accepts the SUCCESS execution name returned by current Studionet receipts", async () => {
    const receipt = { statusName: "FINALIZED", resultName: "MAJORITY_AGREE", txExecutionResultName: "SUCCESS" };
    waitForTransactionReceipt.mockResolvedValue(receipt);
    expect(executionDecision(receipt)).toBe("SUCCESS");
    expect(isSuccessfulExecution("SUCCESS")).toBe(true);
    await expect(waitForSuccessfulFinality(`0x${"5".repeat(64)}`)).resolves.toMatchObject({ ok: true });
  });

  it("rejects FINALIZED plus NO_MAJORITY", async () => {
    waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED", resultName: "NO_MAJORITY", txExecutionResultName: "FINISHED_WITH_RETURN" });
    await expect(waitForSuccessfulFinality(`0x${"2".repeat(64)}`)).resolves.toMatchObject({ ok: false, kind: "CONSENSUS" });
  });

  it("rejects a failed or merely pending execution", async () => {
    waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED", resultName: "MAJORITY_AGREE", txExecutionResultName: "PENDING" });
    await expect(waitForSuccessfulFinality(`0x${"3".repeat(64)}`)).resolves.toMatchObject({ ok: false, kind: "EXECUTION" });
  });

  it("rejects a receipt without explicit consensus", async () => {
    waitForTransactionReceipt.mockResolvedValue({ statusName: "FINALIZED", txExecutionResultName: "FINISHED_WITH_RETURN" });
    await expect(waitForSuccessfulFinality(`0x${"4".repeat(64)}`)).resolves.toMatchObject({ ok: false, kind: "CONSENSUS" });
  });
});
