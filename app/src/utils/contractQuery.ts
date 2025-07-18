import { ethers } from "ethers";
import { getPublicClient } from '@wagmi/core';
import { config } from '../wagmi';
import { getConfig } from "../config";
import NFTClaimABI from "../../contracts/NFTClaim.abi.json";

/**
 * 创建只读合约实例
 */
function createReadOnlyContract() {
  const appConfig = getConfig();
  const publicClient = getPublicClient(config);
  
  if (!publicClient) {
    throw new Error('无法获取公共客户端');
  }

  // 创建只读提供者
  const provider = new ethers.providers.JsonRpcProvider(publicClient.transport.url);
  
  // 创建只读合约实例
  return new ethers.Contract(appConfig.CONTRACT_ADDRESS, NFTClaimABI, provider);
}

/**
 * 检查用户是否已经领取过NFT
 * @param userAddress 用户地址
 * @returns 是否已领取
 */
export async function checkUserClaimed(userAddress: string): Promise<boolean> {
  try {
    const contract = createReadOnlyContract();
    const hasClaimed = await contract.hasUserClaimed(userAddress);
    return hasClaimed;
  } catch (error) {
    console.error('检查用户领取状态失败:', error);
    return false;
  }
}

/**
 * 检查用户名是否已被使用
 * @param screenName 用户名
 * @returns 是否已被使用
 */
export async function checkScreenNameUsed(screenName: string): Promise<boolean> {
  try {
    const contract = createReadOnlyContract();
    const isUsed = await contract.isScreenNameUsed(screenName);
    return isUsed;
  } catch (error) {
    console.error('检查用户名使用状态失败:', error);
    return false;
  }
}

/**
 * 获取用户的完整领取状态信息
 * @param userAddress 用户地址
 * @returns 用户领取状态信息
 */
export async function getUserClaimStatus(userAddress: string): Promise<{
  claimed: boolean;
  tokenIds: number[];
  nftIds: number[];
  totalOwnedCount: number;
}> {
  try {
    const contract = createReadOnlyContract();
    const result = await contract.getUserClaimStatus(userAddress);
    
    return {
      claimed: result.claimed,
      tokenIds: result.tokenIds.map((id: ethers.BigNumber) => id.toNumber()),
      nftIds: result.nftIds.map((id: ethers.BigNumber) => id.toNumber()),
      totalOwnedCount: result.totalOwnedCount.toNumber()
    };
  } catch (error) {
    console.error('获取用户领取状态失败:', error);
    return {
      claimed: false,
      tokenIds: [],
      nftIds: [],
      totalOwnedCount: 0
    };
  }
}

/**
 * 获取合约的总体状态信息
 * @returns 合约状态信息
 */
export async function getContractStatus(): Promise<{
  totalClaimed: number;
  totalSupply: number;
  remainingSupply: number;
  maxNftId: number;
}> {
  try {
    const contract = createReadOnlyContract();
    const result = await contract.getContractStatus();
    
    return {
      totalClaimed: result.totalClaimed_.toNumber(),
      totalSupply: result.totalSupply_.toNumber(),
      remainingSupply: result.remainingSupply.toNumber(),
      maxNftId: result.maxNftId.toNumber()
    };
  } catch (error) {
    console.error('获取合约状态失败:', error);
    return {
      totalClaimed: 0,
      totalSupply: 1000,
      remainingSupply: 1000,
      maxNftId: 8
    };
  }
}

/**
 * 获取指定NFT ID的领取数量
 * @param nftId NFT ID
 * @returns 领取数量
 */
export async function getNftClaimedCount(nftId: number): Promise<number> {
  try {
    const contract = createReadOnlyContract();
    const count = await contract.getClaimedCount(nftId);
    return count.toNumber();
  } catch (error) {
    console.error('获取NFT领取数量失败:', error);
    return 0;
  }
}

/**
 * 获取剩余供应量
 * @returns 剩余供应量
 */
export async function getRemainingSupply(): Promise<number> {
  try {
    const contract = createReadOnlyContract();
    const remaining = await contract.getRemainingSupply();
    return remaining.toNumber();
  } catch (error) {
    console.error('获取剩余供应量失败:', error);
    return 0;
  }
}

/**
 * 批量检查多个用户的领取状态
 * @param userAddresses 用户地址数组
 * @returns 领取状态数组
 */
export async function batchCheckUserClaimed(userAddresses: string[]): Promise<boolean[]> {
  try {
    const contract = createReadOnlyContract();
    const promises = userAddresses.map(address => contract.hasUserClaimed(address));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('批量检查用户领取状态失败:', error);
    return userAddresses.map(() => false);
  }
}

/**
 * 检查用户是否符合领取条件
 * @param userAddress 用户地址
 * @param nftId NFT ID
 * @returns 检查结果
 */
export async function checkClaimEligibility(userAddress: string, nftId: number): Promise<{
  canClaim: boolean;
  reasons: string[];
  contractStatus: {
    totalClaimed: number;
    totalSupply: number;
    remainingSupply: number;
    maxNftId: number;
  };
}> {
  try {
    const reasons: string[] = [];
    
    // 获取合约状态
    const contractStatus = await getContractStatus();
    
    // 检查总供应量
    if (contractStatus.totalClaimed >= contractStatus.totalSupply) {
      reasons.push('所有NFT已被领取完毕');
    }
    
    // 检查NFT ID是否有效
    if (nftId > contractStatus.maxNftId) {
      reasons.push(`无效的NFT ID，最大ID为 ${contractStatus.maxNftId}`);
    }
    
    // 检查用户是否已领取
    const hasClaimed = await checkUserClaimed(userAddress);
    if (hasClaimed) {
      reasons.push('您已经领取过NFT了，每个地址只能领取一次');
    }
    
    return {
      canClaim: reasons.length === 0,
      reasons,
      contractStatus
    };
  } catch (error) {
    console.error('检查领取资格失败:', error);
    return {
      canClaim: false,
      reasons: ['无法检查领取资格，请重试'],
      contractStatus: {
        totalClaimed: 0,
        totalSupply: 1000,
        remainingSupply: 1000,
        maxNftId: 8
      }
    };
  }
}