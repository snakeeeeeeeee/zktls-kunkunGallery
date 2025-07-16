import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  okxWallet,
  metaMaskWallet,
  phantomWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { monadTestnet } from './config';

export const config = getDefaultConfig({
  appName: 'KUNKUN Gallery',
  projectId: 'c4f79cc821944d9680842e34466bfbd', // 临时项目ID
  chains: [monadTestnet],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [okxWallet], // 只推荐 OKX 钱包
    },
    {
      groupName: 'Other',
      wallets: [metaMaskWallet, phantomWallet], // 其他钱包作为备选
    },
  ],
  ssr: false,
});