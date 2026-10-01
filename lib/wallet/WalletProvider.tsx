"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STUDIONET } from "@/lib/genlayer/network";
import type { Eip1193Provider } from "./types";

type WalletContextValue = {
  provider: Eip1193Provider | null;
  account: `0x${string}` | null;
  chainId: number | null;
  connected: boolean;
  correctNetwork: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToStudionet: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const parseChain = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isFinite(parsed) ? parsed : null;
};

const firstAccount = (value: unknown): `0x${string}` | null => {
  if (!Array.isArray(value) || typeof value[0] !== "string" || !value[0].startsWith("0x")) return null;
  return value[0] as `0x${string}`;
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider] = useState<Eip1193Provider | null>(() => typeof window === "undefined" ? null : window.ethereum ?? null);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const injected = provider;
    if (!injected) return;

    void injected.request({ method: "eth_accounts" }).then((value) => setAccount(firstAccount(value))).catch(() => undefined);
    void injected.request({ method: "eth_chainId" }).then((value) => setChainId(parseChain(value))).catch(() => undefined);

    const onAccounts = (...args: unknown[]) => setAccount(firstAccount(args[0]));
    const onChain = (...args: unknown[]) => setChainId(parseChain(args[0]));
    const onDisconnect = () => setAccount(null);
    injected.on?.("accountsChanged", onAccounts);
    injected.on?.("chainChanged", onChain);
    injected.on?.("disconnect", onDisconnect);
    return () => {
      injected.removeListener?.("accountsChanged", onAccounts);
      injected.removeListener?.("chainChanged", onChain);
      injected.removeListener?.("disconnect", onDisconnect);
    };
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) {
      setError("No injected EVM wallet was found. Install MetaMask, Rabby, or another EIP-1193 wallet.");
      return;
    }
    setError(null);
    try {
      setAccount(firstAccount(await provider.request({ method: "eth_requestAccounts" })));
      setChainId(parseChain(await provider.request({ method: "eth_chainId" })));
    } catch (cause) {
      setError((cause as Error)?.message || "Wallet connection was rejected.");
    }
  }, [provider]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  const switchToStudionet = useCallback(async () => {
    if (!provider) throw new Error("No injected wallet available");
    setError(null);
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET.hexId }] });
    } catch (cause) {
      const code = (cause as { code?: number })?.code;
      if (code !== 4902) {
        const message = (cause as Error)?.message || "Network switch was rejected.";
        setError(message);
        throw cause;
      }
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: STUDIONET.hexId,
          chainName: STUDIONET.name,
          nativeCurrency: STUDIONET.currency,
          rpcUrls: [STUDIONET.rpcUrl],
          blockExplorerUrls: [STUDIONET.explorerUrl],
        }],
      });
    }
    setChainId(parseChain(await provider.request({ method: "eth_chainId" })));
  }, [provider]);

  const value = useMemo<WalletContextValue>(() => ({
    provider,
    account,
    chainId,
    connected: account !== null,
    correctNetwork: chainId === STUDIONET.id,
    error,
    connect,
    disconnect,
    switchToStudionet,
  }), [provider, account, chainId, error, connect, disconnect, switchToStudionet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider");
  return context;
}
