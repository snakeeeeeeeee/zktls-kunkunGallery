import { ethers } from "ethers";
import { message } from "antd";
import NFTClaimABI from "../contracts/NFTClaim.abi.json";
import { getConfig } from "./config";

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
    // 获取当前配置
    const config = getConfig();
    const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
    
    console.log('开始领取KUNKUN NFT...', {
      contractAddress: CONTRACT_ADDRESS,
      attestation,
      nftId,
      walletAddress
    });

    // 检查合约地址是否有效
    console.log('CONTRACT_ADDRESS', CONTRACT_ADDRESS);
    if (CONTRACT_ADDRESS === "0xYourDeployedContractAddress") {
      throw new Error('请先设置正确的合约地址。请联系管理员或在设置中配置合约地址。');
    }

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
    const contract = new ethers.Contract(CONTRACT_ADDRESS, NFTClaimABI, signer);

    message.loading('正在发送交易到区块链...', 0);

    let tx;
    
    // 根据是否有验证数据选择不同的领取方式
    if (attestation && typeof attestation === 'object') {
      // 使用验证数据领取
      console.log('使用验证数据领取NFT');
      
      // 确保 attestation 结构符合合约要求
      const formattedAttestation = {
        recipient: attestation.recipient || walletAddress,
        request: attestation.request,
        reponseResolve: attestation.reponseResolve || [],
        data: attestation.data || "",
        attConditions: attestation.attConditions || "",
        timestamp: attestation.timestamp || Math.floor(Date.now() / 1000),
        additionParams: attestation.additionParams || "",
        attestors: attestation.attestors || [],
        signatures: attestation.signatures || []
      };
      
      tx = await contract.claimNFT(formattedAttestation, nftId);
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
    } else if (error.message?.includes('Invalid attestation')) {
      errorMessage = '验证数据无效';
    } else if (error.message?.includes('请先设置正确的合约地址')) {
      errorMessage = error.message;
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

    // 获取当前配置
    const config = getConfig();
    const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, NFTClaimABI, provider);

    const hasClaimed = await contract.hasClaimed(walletAddress);
    return hasClaimed;
  } catch (error) {
    console.error('检查领取状态失败:', error);
    return false;
  }
}

/**
 * 设置合约地址（用于动态更新）
 */
export function setContractAddress(address: string) {
  // 注意：这里需要重新导出或使用全局变量来更新合约地址
  console.log('设置合约地址:', address);
} 