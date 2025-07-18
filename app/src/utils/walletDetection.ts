/**
 * 钱包检测工具函数
 */

// 钱包检测结果接口
interface WalletDetectionResult {
  isAvailable: boolean;
  provider: any;
  walletType: 'MetaMask' | 'OKX' | 'Other' | 'None';
}

/**
 * 等待钱包加载完成
 * @param timeout 超时时间（毫秒）
 */
export async function waitForWallet(timeout: number = 5000): Promise<WalletDetectionResult> {
  return new Promise((resolve) => {
    const checkWallet = (): WalletDetectionResult => {
      // 检查浏览器环境
      if (typeof window === 'undefined') {
        return {
          isAvailable: false,
          provider: null,
          walletType: 'None'
        };
      }

      // 检查 OKX 钱包
      if (window.okxwallet) {
        return {
          isAvailable: true,
          provider: window.okxwallet,
          walletType: 'OKX'
        };
      }

      // 检查 MetaMask
      if (window.ethereum?.isMetaMask) {
        return {
          isAvailable: true,
          provider: window.ethereum,
          walletType: 'MetaMask'
        };
      }

      // 检查其他以太坊钱包
      if (window.ethereum) {
        return {
          isAvailable: true,
          provider: window.ethereum,
          walletType: 'Other'
        };
      }

      return {
        isAvailable: false,
        provider: null,
        walletType: 'None'
      };
    };

    // 立即检查一次
    let result = checkWallet();
    if (result.isAvailable) {
      resolve(result);
      return;
    }

    // 设置轮询检查
    const startTime = Date.now();
    const pollInterval = 100; // 每100ms检查一次
    
    const poll = () => {
      result = checkWallet();
      
      if (result.isAvailable) {
        resolve(result);
        return;
      }
      
      // 检查超时
      if (Date.now() - startTime >= timeout) {
        resolve(result);
        return;
      }
      
      setTimeout(poll, pollInterval);
    };

    // 监听 ethereum 对象注入事件
    if (typeof window !== 'undefined') {
      const handleEthereumReady = () => {
        result = checkWallet();
        if (result.isAvailable) {
          resolve(result);
          return;
        }
      };

      // 监听多种可能的事件
      window.addEventListener('ethereum#initialized', handleEthereumReady);
      window.addEventListener('eip6963:announceProvider', handleEthereumReady);
      
      // 清理监听器
      setTimeout(() => {
        window.removeEventListener('ethereum#initialized', handleEthereumReady);
        window.removeEventListener('eip6963:announceProvider', handleEthereumReady);
      }, timeout);
    }

    // 开始轮询
    setTimeout(poll, pollInterval);
  });
}

/**
 * 检查钱包是否可用
 */
export function isWalletAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!(window.ethereum || window.okxwallet);
}

/**
 * 获取钱包类型
 */
export function getWalletType(): 'MetaMask' | 'OKX' | 'Other' | 'None' {
  if (typeof window === 'undefined') return 'None';
  
  if (window.okxwallet) return 'OKX';
  if (window.ethereum?.isMetaMask) return 'MetaMask';
  if (window.ethereum) return 'Other';
  
  return 'None';
}

/**
 * 获取钱包提供者
 */
export function getWalletProvider(): any {
  if (typeof window === 'undefined') return null;
  
  return window.okxwallet || window.ethereum || null;
}

// 扩展 Window 接口
declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
  }
}