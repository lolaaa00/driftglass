import { TransactionStatus, type GenLayerTransaction } from "genlayer-js/types";
import { createReadClient } from "@/lib/genlayer/client";

export type FinalityResult =
  | { ok: true; receipt: GenLayerTransaction }
  | { ok: false; kind: "TIMEOUT" | "CONSENSUS" | "EXECUTION"; message: string; receipt?: GenLayerTransaction };

type ReceiptArgs = {
  hash: `0x${string}`;
  status: TransactionStatus;
  interval: number;
  retries: number;
  fullTransaction: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function allStrings(value: unknown, path = ""): Array<[string, string]> {
  if (typeof value === "string") return [[path, value]];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => allStrings(nested, path ? `${path}.${key}` : key));
}

function leaderExecution(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = leaderExecution(item);
      if (result) return result;
    }
    return null;
  }
  const object = value as Record<string, unknown>;
  const mode = typeof object.mode === "string" ? object.mode.toUpperCase() : "";
  if (mode === "LEADER") {
    const result = object.execution_result ?? object.executionResult;
    if (typeof result === "string") return result.toUpperCase();
  }
  for (const nested of Object.values(object)) {
    const result = leaderExecution(nested);
    if (result) return result;
  }
  return null;
}

export function consensusDecision(receipt: unknown): string | null {
  const candidates = allStrings(receipt)
    .filter(([path]) => /consensus|result|vote|majority|status/i.test(path))
    .map(([, value]) => value.toUpperCase());
  if (candidates.some((value) => value.includes("NO_MAJORITY"))) return "NO_MAJORITY";
  if (candidates.some((value) => value.includes("MAJORITY_DISAGREE"))) return "MAJORITY_DISAGREE";
  if (candidates.some((value) => value.includes("MAJORITY_AGREE"))) return "MAJORITY_AGREE";
  return null;
}

export function executionDecision(receipt: unknown): string | null {
  const object = receipt as Record<string, unknown> | null;
  const direct = object?.txExecutionResultName ?? object?.tx_execution_result_name ?? object?.executionResult ?? object?.execution_result;
  if (typeof direct === "string") return direct.toUpperCase();
  const leader = leaderExecution(receipt);
  if (leader) return leader;
  const candidates = allStrings(receipt).filter(([path]) => /execution.*result|result.*execution/i.test(path)).map(([, value]) => value.toUpperCase());
  if (candidates.length === 1) return candidates[0];
  return null;
}

export function isSuccessfulExecution(result: string | null): boolean {
  return result === "FINISHED_WITH_RETURN" || result === "SUCCESS";
}

export async function waitForSuccessfulFinality(hash: string): Promise<FinalityResult> {
  const client = createReadClient();
  const wait = client.waitForTransactionReceipt as unknown as (args: ReceiptArgs) => Promise<GenLayerTransaction>;
  let receipt: GenLayerTransaction | undefined;
  for (let propagationAttempt = 0; propagationAttempt < 5; propagationAttempt += 1) {
    try {
      receipt = await wait({
        hash: hash as `0x${string}`,
        status: TransactionStatus.FINALIZED,
        interval: 3000,
        retries: 80,
        fullTransaction: true,
      });
      break;
    } catch (cause) {
      const message = (cause as Error)?.message ?? "Finality polling failed";
      if (!/not found/i.test(message) || propagationAttempt === 4) {
        return { ok: false, kind: "TIMEOUT", message };
      }
      await sleep(1000);
    }
  }
  if (!receipt || String(receipt.statusName).toUpperCase() !== "FINALIZED") {
    return { ok: false, kind: "TIMEOUT", message: "Transaction did not reach FINALIZED", receipt };
  }
  const consensus = consensusDecision(receipt);
  if (consensus !== "MAJORITY_AGREE") {
    return { ok: false, kind: "CONSENSUS", message: `Finalized without successful consensus (${consensus ?? "unknown consensus result"})`, receipt };
  }
  const execution = executionDecision(receipt);
  if (!isSuccessfulExecution(execution)) {
    return { ok: false, kind: "EXECUTION", message: `Consensus agreed but execution did not succeed (${execution ?? "unknown execution result"})`, receipt };
  }
  return { ok: true, receipt };
}
