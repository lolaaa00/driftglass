export const DRIFTGLASS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DRIFTGLASS_CONTRACT_ADDRESS ?? "0x462b2edA0f7A4E6E417c11b3f737496272745980") as `0x${string}`;

export function requireContractAddress(): `0x${string}` {
  if (!/^0x[a-fA-F0-9]{40}$/.test(DRIFTGLASS_CONTRACT_ADDRESS)) {
    throw new Error("Driftglass contract is not configured with a valid Studionet address.");
  }
  return DRIFTGLASS_CONTRACT_ADDRESS as `0x${string}`;
}
