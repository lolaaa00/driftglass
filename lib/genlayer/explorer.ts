import { STUDIONET_EXPLORER_URL } from "./network";

export const transactionExplorerUrl = (hash: string) => `${STUDIONET_EXPLORER_URL}/tx/${hash}`;
export const addressExplorerUrl = (address: string) => `${STUDIONET_EXPLORER_URL}/address/${address}`;
