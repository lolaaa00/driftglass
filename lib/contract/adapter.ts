import { createReadClient, createWriteClient } from "@/lib/genlayer/client";
import type { CalldataEncodable } from "genlayer-js/types";
import type { Eip1193Provider } from "@/lib/wallet/types";
import { requireContractAddress } from "./address";
import type { Checkpoint, DraftInput, Revision, RightExercise, WatchRecord } from "./types";

const parse = <T>(value: unknown): T => JSON.parse(String(value)) as T;

export async function readWatch(id: string): Promise<WatchRecord> {
  const raw = await createReadClient().readContract({ address: requireContractAddress(), functionName: "get_watch", args: [id] });
  return parse<WatchRecord>(raw);
}

export async function readRevisions(id: string): Promise<Revision[]> {
  const raw = await createReadClient().readContract({ address: requireContractAddress(), functionName: "get_revisions", args: [id] });
  return parse<Revision[]>(raw);
}

export async function readCheckpoints(id: string): Promise<Checkpoint[]> {
  const raw = await createReadClient().readContract({ address: requireContractAddress(), functionName: "get_checkpoints", args: [id] });
  return parse<Checkpoint[]>(raw);
}

export async function readExercises(id: string): Promise<RightExercise[]> {
  const raw = await createReadClient().readContract({ address: requireContractAddress(), functionName: "get_exercises", args: [id] });
  return parse<RightExercise[]>(raw);
}

export async function readPolicyDigest(id: string): Promise<string> {
  return String(await createReadClient().readContract({ address: requireContractAddress(), functionName: "get_policy_digest", args: [id] }));
}

export async function readRevisionProposal(id: string): Promise<Record<string, unknown>> {
  const raw = await createReadClient().readContract({ address: requireContractAddress(), functionName: "get_revision_proposal", args: [id] });
  return parse<Record<string, unknown>>(raw);
}

export async function listWatchIds(offset = 0, limit = 24): Promise<string[]> {
  return await createReadClient().readContract({ address: requireContractAddress(), functionName: "list_watch_ids", args: [offset, limit] }) as string[];
}

export async function listCreatorWatchIds(creator: string, offset = 0, limit = 50): Promise<string[]> {
  return await createReadClient().readContract({ address: requireContractAddress(), functionName: "list_creator_watch_ids", args: [creator, offset, limit] }) as string[];
}

async function write(account: `0x${string}`, provider: Eip1193Provider, functionName: string, args: CalldataEncodable[]): Promise<string> {
  return await createWriteClient(account, provider).writeContract({
    address: requireContractAddress(),
    functionName,
    args,
    value: 0n,
  }) as unknown as string;
}

export const submitCreateDraft = (account: `0x${string}`, provider: Eip1193Provider, input: DraftInput) =>
  write(account, provider, "create_draft", [input.subject, input.canonicalDomain, input.sourceUrls, input.clauses, input.authorityUrl, input.beneficiary, input.rightLabel, input.reviewIntervalSeconds, input.note]);

export const submitActivateBaseline = (account: `0x${string}`, provider: Eip1193Provider, id: string) =>
  write(account, provider, "activate_baseline", [id]);

export const submitCheckpoint = (account: `0x${string}`, provider: Eip1193Provider, id: string) =>
  write(account, provider, "run_checkpoint", [id]);

export const submitArchive = (account: `0x${string}`, provider: Eip1193Provider, id: string) =>
  write(account, provider, "archive_watch", [id]);

export const submitProposeRevision = (
  account: `0x${string}`,
  provider: Eip1193Provider,
  id: string,
  input: Pick<DraftInput, "sourceUrls" | "clauses" | "reviewIntervalSeconds" | "note">,
) => write(account, provider, "propose_revision", [id, input.sourceUrls, input.clauses, input.reviewIntervalSeconds, input.note]);

export const submitActivateRevision = (account: `0x${string}`, provider: Eip1193Provider, id: string) =>
  write(account, provider, "activate_revision", [id]);

export const submitExerciseRight = (account: `0x${string}`, provider: Eip1193Provider, id: string, actionDigest: string) =>
  write(account, provider, "exercise_right", [id, actionDigest]);
