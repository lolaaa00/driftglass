import { describe, expect, it } from "vitest";
import { transactionExplorerUrl } from "@/lib/genlayer/explorer";
import { isStudionet, STUDIONET_CHAIN_HEX, STUDIONET_CHAIN_ID, STUDIONET_RPC_URL } from "@/lib/genlayer/network";

describe("network pin", () => {
  it("uses only Studionet", () => {
    expect(STUDIONET_CHAIN_ID).toBe(61999);
    expect(STUDIONET_CHAIN_HEX).toBe("0xf22f");
    expect(STUDIONET_RPC_URL).toBe("https://studio.genlayer.com/api");
    expect(isStudionet(61999)).toBe(true);
    expect(isStudionet(1)).toBe(false);
  });

  it("links finalized writes to the Studionet transaction route", () => {
    expect(transactionExplorerUrl("0xabc")).toBe("https://explorer-studio.genlayer.com/tx/0xabc");
  });
});
