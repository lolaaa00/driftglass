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

export const parseChainId = (value: unknown): number | null => {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return null;
  const parsed = Number.parseInt(value.slice(2), 16);
  return Number.isFinite(parsed) ? parsed : null;
};

export const firstAccount = (value: unknown): `0x${string}` | null => {
  if (!Array.isArray(value) || typeof value[0] !== "string" || !/^0x[0-9a-f]{40}$/i.test(value[0])) return null;
  return value[0] as `0x${string}`;
};

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Eip1193Provider | null>(() => typeof window === "undefined" ? null : window.ethereum ?? null);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const injected = provider;
    if (!injected) return;

    void injected.request({ method: "eth_accounts" }).then((value) => setAccount(firstAccount(value))).catch(() => undefined);
    void injected.request({ method: "eth_chainId" }).then((value) => setChainId(parseChainId(value))).catch(() => undefined);

    const onAccounts = (...args: unknown[]) => setAccount(firstAccount(args[0]));
    const onChain = (...args: unknown[]) => setChainId(parseChainId(args[0]));
    const onDisconnect = () => { setAccount(null); setChainId(null); };
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
    const injected = provider ?? window.ethereum ?? null;
    if (!injected) {
      setError("No injected EVM wallet was found. Install MetaMask, Rabby, or another EIP-1193 wallet.");
      return;
    }
    if (injected !== provider) setProvider(injected);
    setError(null);
    try {
      const nextAccount = firstAccount(await injected.request({ method: "eth_requestAccounts" }));
      if (!nextAccount) throw new Error("The wallet did not return a valid EVM account.");
      setAccount(nextAccount);
      setChainId(parseChainId(await injected.request({ method: "eth_chainId" })));
    } catch (cause) {
      setError(errorMessage(cause, "Wallet connection was rejected."));
    }
  }, [provider]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  const switchToStudionet = useCallback(async () => {
    if (!provider) {
      setError("No injected wallet is available.");
      return;
    }
    setError(null);
    try {
      try {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET.hexId }] });
      } catch (cause) {
        const code = (cause as { code?: number })?.code;
        if (code !== 4902) throw cause;
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
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIONET.hexId }] });
      }
      const nextChain = parseChainId(await provider.request({ method: "eth_chainId" }));
      setChainId(nextChain);
      if (nextChain !== STUDIONET.id) throw new Error("The wallet did not switch to GenLayer Studionet.");
    } catch (cause) {
      const message = errorMessage(cause, "Network switch was rejected.");
      setError(message);
    }
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
