import { ethers } from 'ethers';
import type { WalletClient } from 'viem';

export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain } = walletClient;
  
  // 直接使用 window.ethereum，因为 RainbowKit 已经确保它指向正确的钱包
  if (!window.ethereum) {
    throw new Error('未检测到钱包提供者');
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  
  // 使用当前连接的钱包提供者创建 ethers provider
  const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, network);
  const signer = ethersProvider.getSigner(account.address);
  return signer;
}