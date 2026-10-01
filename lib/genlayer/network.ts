export const STUDIONET_CHAIN_ID = 61999 as const;
export const STUDIONET_CHAIN_HEX = "0xf22f" as const;
export const STUDIONET_RPC_URL = "https://studio.genlayer.com/api" as const;
export const STUDIONET_EXPLORER_URL = "https://explorer-studio.genlayer.com" as const;

export const STUDIONET = {
  id: STUDIONET_CHAIN_ID,
  hexId: STUDIONET_CHAIN_HEX,
  name: "GenLayer Studionet",
  rpcUrl: STUDIONET_RPC_URL,
  explorerUrl: STUDIONET_EXPLORER_URL,
  currency: { name: "GEN", symbol: "GEN", decimals: 18 },
} as const;

export function isStudionet(chainId: number | null): boolean {
  return chainId === STUDIONET_CHAIN_ID;
}
