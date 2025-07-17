// 项目配置文件
import { defineChain } from 'viem'

export interface Config {
  // 合约配置
  CONTRACT_ADDRESS: string;

  // 网络配置 
  NETWORK: {
    name: string;
    chainId: number;
    rpcUrl: string;
    blockExplorer: string;
  };

  // NFT 配置
  NFT: {
    maxId: number;
    totalSupply: number;
  };
}

// 定义 Monad 测试网 chain
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
})

export const DEFAULT_CONFIG: Config = {
  CONTRACT_ADDRESS: "0xDF83C72DbCAb0c53fc88060eF435CAEB2758cF6d",

  NETWORK: {
    name: "Monad Testnet",
    chainId: 10143,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    blockExplorer: "https://testnet.monadexplorer.com"
  },

  NFT: {
    maxId: 8,
    totalSupply: 1000
  }
};

// 获取当前配置
export function getConfig(): Config {
  // 这里可以从环境变量或本地存储读取配置
  const customContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS ||
    localStorage.getItem('contract_address');

  return {
    ...DEFAULT_CONFIG,
    CONTRACT_ADDRESS: customContractAddress || DEFAULT_CONFIG.CONTRACT_ADDRESS
  };
}

// 设置合约地址
export function setContractAddress(address: string): void {
  localStorage.setItem('contract_address', address);
  console.log('合约地址已更新:', address);
}

// 验证合约地址格式
export function isValidContractAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// 自动切换到 Monad 测试网
export async function switchToMonadTestnet(): Promise<boolean> {
  if (!window.ethereum) {
    console.error('未检测到以太坊钱包');
    return false;
  }

  try {
    // 尝试切换到 Monad 测试网
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${DEFAULT_CONFIG.NETWORK.chainId.toString(16)}` }], // 10143 转为十六进制
    });

    console.log('✅ 已切换到 Monad 测试网');
    return true;
  } catch (switchError: any) {
    // 如果网络不存在，则添加网络
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${DEFAULT_CONFIG.NETWORK.chainId.toString(16)}`,
              chainName: DEFAULT_CONFIG.NETWORK.name,
              rpcUrls: [DEFAULT_CONFIG.NETWORK.rpcUrl],
              nativeCurrency: {
                name: 'MON',
                symbol: 'MON',
                decimals: 18,
              },
              blockExplorerUrls: [DEFAULT_CONFIG.NETWORK.blockExplorer],
            },
          ],
        });

        console.log('✅ 已添加并切换到 Monad 测试网');
        return true;
      } catch (addError) {
        console.error('添加 Monad 测试网失败:', addError);
        return false;
      }
    }

    console.error('切换到 Monad 测试网失败:', switchError);
    return false;
  }
}

// 导出当前配置
export const config = getConfig(); 