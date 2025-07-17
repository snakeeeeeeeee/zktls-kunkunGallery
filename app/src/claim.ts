import { ethers } from "ethers";
import { message } from "antd";
import NFTClaimABI from "../contracts/NFTClaim.abi.json";
import { getConfig } from "./config";
import { getWalletClient, getPublicClient } from '@wagmi/core';
import { config } from './wagmi';

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
    const appConfig = getConfig();
    const CONTRACT_ADDRESS = appConfig.CONTRACT_ADDRESS;

    console.log('开始领取KUNKUN NFT...', {
      contractAddress: CONTRACT_ADDRESS,
      attestation,
      nftId,
      walletAddress
    });

    console.log('CONTRACT_ADDRESS', CONTRACT_ADDRESS);


    // 使用 wagmi 获取钱包客户端，避免多钱包冲突
    const walletClient = await getWalletClient(config);
    if (!walletClient) {
      throw new Error('请先连接钱包');
    }

    // 确认钱包地址匹配
    if (walletClient.account.address.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error('钱包地址不匹配，请使用正确的钱包账户');
    }

    // 通过 wagmi 创建兼容的 ethereum 提供者
    const ethereumProvider = {
      request: async ({ method, params }: { method: string; params?: any[] }) => {
        return await walletClient.request({ method: method as any, params: params as any });
      },
      isMetaMask: false,
      isConnected: () => true,
      on: () => {},
      removeListener: () => {},
    };

    // 创建 ethers provider 和 signer，使用 wagmi 的钱包客户端
    const provider = new ethers.providers.Web3Provider(ethereumProvider as any);
    const signer = provider.getSigner(walletClient.account.address);

    // 创建合约实例
    const contract = new ethers.Contract(CONTRACT_ADDRESS, NFTClaimABI, signer);

    message.loading('正在发送交易到区块链...', 0);

    let tx;

    // 根据是否有验证数据选择不同的领取方式
    if (attestation && typeof attestation === 'object') {
      // 使用验证数据领取
      console.log('使用验证数据领取NFT');


      // 先检查是否已经领取过
      const hasClaimed = await contract.hasClaimed(walletAddress);
      if (hasClaimed) {
        throw new Error('您已经领取过NFT了');
      }

      // 手动设置gas限制来解决估算问题
      const gasLimit = 300000; // 手动设置gas限制

      try {
        // 先尝试估算gas
        const estimatedGas = await contract.estimateGas.claimNFT(attestation, nftId);
        console.log('估算的gas:', estimatedGas.toString());
        
        tx = await contract.claimNFT(attestation, nftId, {
          gasLimit: estimatedGas.mul(120).div(100) // 增加20%的gas buffer
        });
      } catch (estimateError) {
        console.warn('Gas估算失败，使用手动gas限制:', estimateError);
        
        // 如果估算失败，使用手动gas限制
        tx = await contract.claimNFT(attestation, nftId, {
          gasLimit: gasLimit
        });
      }
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

