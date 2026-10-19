import { describe, expect, it, vi } from "vitest";
import { confirmAuthoritativeState } from "@/lib/contract/TransactionProvider";

describe("authoritative state confirmation", () => {
  it("retries temporary RPC lag after finality", async () => {
    const read = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await expect(confirmAuthoritativeState(read, 3, 0)).resolves.toBe(true);
    expect(read).toHaveBeenCalledTimes(3);
  });

  it("fails closed when authoritative state never appears", async () => {
    const read = vi.fn().mockResolvedValue(false);
    await expect(confirmAuthoritativeState(read, 2, 0)).resolves.toBe(false);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("recovers when an RPC read briefly fails after finality", async () => {
    const read = vi.fn().mockRejectedValueOnce(new Error("RPC lag")).mockResolvedValueOnce(true);
    await expect(confirmAuthoritativeState(read, 2, 0)).resolves.toBe(true);
    expect(read).toHaveBeenCalledTimes(2);
  });
});
