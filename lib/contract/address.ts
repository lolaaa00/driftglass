export const DRIFTGLASS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DRIFTGLASS_CONTRACT_ADDRESS ?? "0x808FddD60A7FFd16c7abcCF474A159a7E4B1b4A1") as `0x${string}`;

export function requireContractAddress(): `0x${string}` {
  if (!/^0x[a-fA-F0-9]{40}$/.test(DRIFTGLASS_CONTRACT_ADDRESS)) {
    throw new Error("Driftglass contract is not configured with a valid Studionet address.");
  }
  return DRIFTGLASS_CONTRACT_ADDRESS as `0x${string}`;
}
