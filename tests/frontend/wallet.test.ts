import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { firstAccount, parseChainId, useWallet, WalletProvider } from "@/lib/wallet/WalletProvider";
import type { Eip1193Provider, Eip1193RequestArguments } from "@/lib/wallet/types";

const ADDRESS = `0x${"a".repeat(40)}` as const;

function WalletHarness() {
  const wallet = useWallet();
  return createElement("div", null,
    createElement("span", null, wallet.account ?? "disconnected"),
    createElement("span", null, wallet.correctNetwork ? "studionet" : "wrong-network"),
    createElement("button", { onClick: () => void wallet.connect() }, "Connect"),
    createElement("button", { onClick: () => void wallet.switchToStudionet() }, "Switch"),
  );
}

afterEach(() => {
  cleanup();
  delete window.ethereum;
});

describe("wallet response validation", () => {
  it("accepts canonical EIP-1193 chain IDs", () => {
    expect(parseChainId("0xf22f")).toBe(61999);
    expect(parseChainId("0x1")).toBe(1);
  });

  it("rejects malformed or non-hex chain IDs", () => {
    expect(parseChainId("61999")).toBeNull();
    expect(parseChainId("0xf22f trailing")).toBeNull();
    expect(parseChainId(null)).toBeNull();
  });

  it("accepts only a complete EVM account", () => {
    expect(firstAccount([ADDRESS])).toBe(ADDRESS);
    expect(firstAccount(["0x1234"])).toBeNull();
    expect(firstAccount([])).toBeNull();
  });

  it("connects an injected wallet and confirms its account and network", async () => {
    const request = vi.fn(async ({ method }: Eip1193RequestArguments) => {
      if (method === "eth_accounts") return [];
      if (method === "eth_requestAccounts") return [ADDRESS];
      if (method === "eth_chainId") return "0xf22f";
      throw new Error(`Unexpected method ${method}`);
    });
    window.ethereum = { request };

    render(createElement(WalletProvider, null, createElement(WalletHarness)));
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() => expect(screen.getByText(ADDRESS)).toBeInTheDocument());
    expect(screen.getByText("studionet")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
  });

  it("adds Studionet when missing, switches, and verifies the resulting chain", async () => {
    let currentChain = "0x1";
    let firstSwitch = true;
    const request = vi.fn(async ({ method }: Eip1193RequestArguments) => {
      if (method === "eth_accounts") return [ADDRESS];
      if (method === "eth_chainId") return currentChain;
      if (method === "wallet_addEthereumChain") return null;
      if (method === "wallet_switchEthereumChain") {
        if (firstSwitch) {
          firstSwitch = false;
          throw Object.assign(new Error("Unknown chain"), { code: 4902 });
        }
        currentChain = "0xf22f";
        return null;
      }
      throw new Error(`Unexpected method ${method}`);
    });
    window.ethereum = { request } as Eip1193Provider;

    render(createElement(WalletProvider, null, createElement(WalletHarness)));
    await waitFor(() => expect(screen.getByText(ADDRESS)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Switch" }));

    await waitFor(() => expect(screen.getByText("studionet")).toBeInTheDocument());
    expect(request.mock.calls.map(([args]) => args.method)).toContain("wallet_addEthereumChain");
    expect(request.mock.calls.filter(([args]) => args.method === "wallet_switchEthereumChain")).toHaveLength(2);
  });
});
