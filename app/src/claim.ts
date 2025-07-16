import { ethers } from "ethers";
import { message } from "antd";

// NFT合约相关配置
const CONTRACT_ADDRESS = "0xCE7cefB3B5A7eB44B59F60327A53c9Ce53B0afdE";
const CONTRACT_ABI = [
  // 这里应该放入实际的合约ABI
  // 目前使用简化的ABI示例
  {
    "inputs": [
      {"name": "attestation", "type": "tuple", "components": []},
      {"name": "nftId", "type": "uint256"}
    ],
    "name": "claimNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "nftId", "type": "uint256"}],
    "name": "simpleClaim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * 领取KUNKUN NFT的回调函数
 * @param attestation - ZK-TLS验证的证明数据
 * @param nftId - 要领取的NFT ID
 * @param walletAddress - 用户钱包地址
 * @param onSuccess - 成功回调
 * @param onError - 失败回调
 */
export async function claimKunkunNFT(
  attestation: any,
  nftId: number,
  walletAddress: string,
  onSuccess?: (txHash: string) => void,
  onError?: (error: Error) => void
) {
  try {
    console.log('开始领取KUNKUN NFT...', {
      attestation,
      nftId,
      walletAddress
    });

    // 检查是否有以太坊提供者
    if (!window.ethereum) {
      throw new Error('请安装MetaMask或其他以太坊钱包');
    }

    // 连接到用户的钱包
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 确认钱包地址匹配
    const currentAddress = await signer.getAddress();
    if (currentAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('钱包地址不匹配，请使用正确的钱包账户');
    }

    // 创建合约实例
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    message.loading('正在发送交易到区块链...', 0);

    let tx;
    
    // 根据是否有验证数据选择不同的领取方式
    if (attestation && Object.keys(attestation).length > 0) {
      // 使用验证数据领取
      console.log('使用验证数据领取NFT');
      tx = await contract.claimNFT(attestation, nftId);
    } else {
      // 简单领取（测试用）
      console.log('使用简单模式领取NFT');
      tx = await contract.simpleClaim(nftId);
    }

    message.destroy();
    message.loading('交易已发送，等待区块链确认...', 0);

    // 等待交易确认
    const receipt = await tx.wait();
    
    message.destroy();
    console.log('NFT领取成功！', {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

    message.success('🎉 KUNKUN NFT领取成功！');
    
    // 调用成功回调
    if (onSuccess) {
      onSuccess(receipt.transactionHash);
    }

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };

  } catch (error: any) {
    message.destroy();
    console.error('NFT领取失败:', error);
    
    let errorMessage = '领取失败，请重试';
    
    // 处理常见错误
    if (error.code === 4001) {
      errorMessage = '用户取消了交易';
    } else if (error.code === -32603) {
      errorMessage = '交易失败，可能是合约执行错误';
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = '余额不足，请确保有足够的Gas费用';
    } else if (error.message?.includes('Already claimed')) {
      errorMessage = '您已经领取过NFT了';
    } else if (error.message?.includes('Invalid recipient')) {
      errorMessage = '无效的接收地址';
    } else if (error.message) {
      errorMessage = error.message;
    }

    message.error(errorMessage);
    
    // 调用错误回调
    if (onError) {
      onError(new Error(errorMessage));
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 简化的领取函数（用于测试）
 * @param nftId - NFT ID
 * @param walletAddress - 钱包地址
 */
export async function simpleClaimNFT(
  nftId: number,
  walletAddress: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  return claimKunkunNFT(null, nftId, walletAddress);
}

/**
 * 检查用户是否已经领取过NFT
 * @param walletAddress - 用户钱包地址
 */
export async function checkIfAlreadyClaimed(walletAddress: string): Promise<boolean> {
  try {
    if (!window.ethereum) {
      return false;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, [
      {
        "inputs": [{"name": "", "type": "address"}],
        "name": "hasClaimed",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
      }
    ], provider);

    const hasClaimed = await contract.hasClaimed(walletAddress);
    return hasClaimed;
  } catch (error) {
    console.error('检查领取状态失败:', error);
    return false;
  }
} 