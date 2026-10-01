import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Eip1193Provider } from "@/lib/wallet/types";

export function createReadClient() {
  return createClient({ chain: studionet });
}

export function createWriteClient(account: `0x${string}`, provider: Eip1193Provider) {
  return createClient({ chain: studionet, account, provider });
}
