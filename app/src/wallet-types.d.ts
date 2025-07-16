declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
    };
    okxwallet?: {
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

export {};