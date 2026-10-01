export const DRIFTGLASS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DRIFTGLASS_CONTRACT_ADDRESS ?? "") as `0x${string}` | "";

export function requireContractAddress(): `0x${string}` {
  if (!/^0x[a-fA-F0-9]{40}$/.test(DRIFTGLASS_CONTRACT_ADDRESS)) {
    throw new Error("Driftglass contract is not configured. Set NEXT_PUBLIC_DRIFTGLASS_CONTRACT_ADDRESS after Studionet deployment.");
  }
  return DRIFTGLASS_CONTRACT_ADDRESS as `0x${string}`;
}
