"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { waitForSuccessfulFinality } from "./finality";

export type TransactionPhase =
  | "IDLE"
  | "PREPARING"
  | "AWAITING_SIGNATURE"
  | "SUBMITTED"
  | "CONSENSUS_PENDING"
  | "FINALIZED"
  | "REREADING"
  | "CONFIRMED"
  | "USER_REJECTED"
  | "CONSENSUS_FAILED"
  | "EXECUTION_FAILED"
  | "STATE_MISMATCH"
  | "FAILED";

export interface TransactionState {
  phase: TransactionPhase;
  label?: string;
  hash?: string;
  error?: string;
}

type RunArgs = {
  label: string;
  submit: () => Promise<string>;
  authoritativeReread: () => Promise<boolean>;
  onConfirmed?: () => void;
};

type TransactionContextValue = {
  state: TransactionState;
  busy: boolean;
  run: (args: RunArgs) => Promise<void>;
  clear: () => void;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);
const STORAGE_KEY = "driftglass:last-transaction";
const TERMINAL_PHASES: TransactionPhase[] = ["IDLE", "CONFIRMED", "USER_REJECTED", "CONSENSUS_FAILED", "EXECUTION_FAILED", "STATE_MISMATCH", "FAILED"];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function confirmAuthoritativeState(read: () => Promise<boolean>, attempts = 5, intervalMs = 800): Promise<boolean> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      if (await read()) return true;
      lastError = undefined;
    } catch (cause) {
      lastError = cause;
    }
    if (attempt + 1 < attempts) await sleep(intervalMs);
  }
  if (lastError) throw lastError;
  return false;
}

function restoredState(): TransactionState {
  if (typeof window === "undefined") return { phase: "IDLE" };
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return { phase: "IDLE" };
    const parsed = JSON.parse(saved) as TransactionState;
    if (!TERMINAL_PHASES.includes(parsed.phase)) {
      return { ...parsed, phase: "FAILED", error: "This page was reloaded while the transaction was pending. Check the explorer before retrying." };
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return { phase: "IDLE" };
  }
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TransactionState>(restoredState);
  const running = useRef(false);

  useEffect(() => {
    if (state.phase === "IDLE") sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const run = useCallback(async ({ label, submit, authoritativeReread, onConfirmed }: RunArgs) => {
    if (running.current) return;
    running.current = true;
    setState({ phase: "PREPARING", label });
    setState({ phase: "AWAITING_SIGNATURE", label });
    let hash: string;
    try {
      hash = await submit();
    } catch (cause) {
      const code = (cause as { code?: number })?.code;
      setState({
        phase: code === 4001 ? "USER_REJECTED" : "FAILED",
        label,
        error: code === 4001 ? "The wallet request was rejected." : (cause as Error)?.message ?? "Transaction submission failed.",
      });
      running.current = false;
      return;
    }

    setState({ phase: "SUBMITTED", label, hash });
    setState({ phase: "CONSENSUS_PENDING", label, hash });
    let finality;
    try {
      finality = await waitForSuccessfulFinality(hash);
    } catch (cause) {
      setState({ phase: "FAILED", label, hash, error: (cause as Error)?.message ?? "Finality polling failed." });
      running.current = false;
      return;
    }
    if (!finality.ok) {
      const phase = finality.kind === "CONSENSUS" ? "CONSENSUS_FAILED" : finality.kind === "EXECUTION" ? "EXECUTION_FAILED" : "FAILED";
      setState({ phase, label, hash, error: finality.message });
      running.current = false;
      return;
    }

    setState({ phase: "FINALIZED", label, hash });
    setState({ phase: "REREADING", label, hash });
    try {
      const valid = await confirmAuthoritativeState(authoritativeReread);
      if (!valid) {
        setState({ phase: "STATE_MISMATCH", label, hash, error: "The finalized transaction did not produce the expected contract state." });
      } else {
        setState({ phase: "CONFIRMED", label, hash });
        onConfirmed?.();
      }
    } catch (cause) {
      setState({ phase: "STATE_MISMATCH", label, hash, error: (cause as Error)?.message ?? "Authoritative state reread failed." });
    }
    running.current = false;
  }, []);

  const clear = useCallback(() => setState({ phase: "IDLE" }), []);
  const busy = !TERMINAL_PHASES.includes(state.phase);
  const value = useMemo(() => ({ state, busy, run, clear }), [state, busy, run, clear]);
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransaction must be used inside TransactionProvider");
  return context;
}
