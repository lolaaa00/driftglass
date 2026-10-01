export interface Eip1193RequestArguments {
  method: string;
  params?: unknown[] | object;
}

export interface Eip1193Provider {
  request(args: Eip1193RequestArguments): Promise<unknown>;
  on?(event: "accountsChanged" | "chainChanged" | "disconnect", listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}
