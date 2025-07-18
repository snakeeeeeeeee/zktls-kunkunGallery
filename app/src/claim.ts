import { ethers } from "ethers";
import { message } from "antd";
import NFTClaimABI from "../contracts/NFTClaim.abi.json";
import { getConfig } from "./config";
import { getWalletClient, getPublicClient } from '@wagmi/core';
import { config } from './wagmi';
import { checkClaimEligibility } from "./utils/contractQuery";

/**
 * 解析合约 revert 原因
 * @param error - 错误对象
 * @returns 解析后的错误信息
 */
function parseContractError(error: any): string {
  // 检查是否是合约 revert 错误
  if (error.reason) {
    return error.reason;
  }
  
  // 检查错误消息中的 revert 原因
  if (error.message) {
    const revertMatch = error.message.match(/revert (.+)/);
    if (revertMatch) {
      return revertMatch[1];
    }
    
    // 检查是否包含合约错误信息
    if (error.message.includes('execution reverted')) {
      const revertReasonMatch = error.message.match(/execution reverted: (.+)/);
      if (revertReasonMatch) {
        return revertReasonMatch[1];
      }
    }
  }
  
  // 检查 error.error 中的信息
  if (error.error?.message) {
    return parseContractError(error.error);
  }
  
  return error.message || 'Unknown error';
}

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

    // 预检查合约状态和用户资格
    console.log('检查合约状态和用户资格...');
    message.loading('正在检查领取资格...', 0);
    
    const eligibilityCheck = await checkClaimEligibility(walletAddress, nftId);
    message.destroy();
    
    if (!eligibilityCheck.canClaim) {
      const errorMsg = eligibilityCheck.reasons.join('; ');
      console.error('领取资格检查失败:', errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log('领取资格检查通过', {
      totalClaimed: eligibilityCheck.contractStatus.totalClaimed,
      totalSupply: eligibilityCheck.contractStatus.totalSupply,
      remainingSupply: eligibilityCheck.contractStatus.remainingSupply
    });

    message.loading('正在发送交易到区块链...', 0);

    let tx;

    // 根据是否有验证数据选择不同的领取方式
    if (attestation && typeof attestation === 'object') {
      // 使用验证数据领取
      console.log('使用验证数据领取NFT');

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
        console.warn('Gas估算失败:', estimateError);
        
        // 检查是否是"Screen name already used"错误
        const errorMessage = parseContractError(estimateError);
        if (errorMessage.includes('Screen name already used')) {
          throw new Error('Screen name already used');
        }
        
        // 如果估算失败但不是用户名重复错误，使用手动gas限制
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

    // 解析合约错误
    const parsedError = parseContractError(error);
    let errorMessage = '领取失败，请重试';

    // 处理合约错误和常见错误
    if (error.code === 4001) {
      errorMessage = '用户取消了交易';
    } else if (error.code === -32603) {
      errorMessage = '交易失败，可能是合约执行错误';
    } else if (parsedError.includes('insufficient funds')) {
      errorMessage = '余额不足，请确保有足够的Gas费用';
    } 
    // 合约 require 错误处理
    else if (parsedError.includes('All NFTs have been claimed')) {
      errorMessage = '❌ 所有NFT已被领取完毕';
    } else if (parsedError.includes('Invalid NFT ID')) {
      errorMessage = '❌ 无效的NFT ID，请选择有效的NFT';
    } else if (parsedError.includes('Already claimed')) {
      errorMessage = '❌ 您已经领取过NFT了，每个地址只能领取一次';
    } else if (parsedError.includes('Invalid recipient')) {
      errorMessage = '❌ 验证数据中的接收地址与当前钱包地址不匹配';
    } else if (parsedError.includes('Screen name not found')) {
      errorMessage = '❌ 验证数据中未找到用户名信息';
    } else if (parsedError.includes('Screen name already used')) {
      errorMessage = '该Twitter已被使用';
    } 
    // 验证相关错误
    else if (parsedError.includes('Invalid attestation') || parsedError.includes('Attestation verification failed')) {
      errorMessage = '❌ ZK-TLS验证失败，请重新进行验证';
    }
    // 网络和钱包错误
    else if (parsedError.includes('network')) {
      errorMessage = '❌ 网络错误，请检查网络连接或切换网络';
    } else if (parsedError.includes('请先连接钱包')) {
      errorMessage = '❌ 请先连接钱包';
    } else if (parsedError.includes('钱包地址不匹配')) {
      errorMessage = '❌ 钱包地址不匹配，请使用正确的钱包账户';
    }
    // Gas 相关错误
    else if (parsedError.includes('gas required exceeds allowance') || parsedError.includes('out of gas')) {
      errorMessage = '❌ Gas费用不足，请增加Gas限制或确保有足够的ETH';
    } else if (parsedError.includes('gas price too low')) {
      errorMessage = '❌ Gas价格过低，请提高Gas价格';
    }
    // 交易相关错误
    else if (parsedError.includes('transaction underpriced')) {
      errorMessage = '❌ 交易费用过低，请提高Gas价格';
    } else if (parsedError.includes('nonce too low')) {
      errorMessage = '❌ 交易序号错误，请重试';
    } else if (parsedError.includes('transaction failed')) {
      errorMessage = '❌ 交易执行失败，请检查合约状态';
    }
    // 其他错误
    else if (parsedError.includes('请先设置正确的合约地址')) {
      errorMessage = parsedError;
    } else if (parsedError !== 'Unknown error') {
      errorMessage = `❌ ${parsedError}`;
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

