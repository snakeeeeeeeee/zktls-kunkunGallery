import {PrimusZKTLS} from "@primuslabs/zktls-js-sdk";
import { claimKunkunNFT } from "./claim";
import { message } from "antd";

// Initialize parameters.
const primusZKTLS = new PrimusZKTLS();

//**** Set appId and appSecret here!!!
const appId = "0x4bf0468034fd3e9cc4678915f25b253351c5a3ef";
const appSecret =
  "0xe37b6e481d80c537838f7b16e7fe70bd9d48a7326f32c0eaabdd1c82074c819a";
if(!appId || !appSecret){
    alert("appId or appSecret is not set.")
    throw new Error("appId or appSecret is not set.");
}

const initAttestaionResult = await primusZKTLS.init(appId, appSecret);
console.log("primusProof initAttestaionResult=", initAttestaionResult);

/**
 * Primus 验证并自动领取 NFT
 * @param walletAddress - 当前连接钱包的地址
 * @param onVerifySuccess - 验证成功回调
 * @param onClaimSuccess - 领取成功回调  
 * @param onError - 错误回调
 * @param nftId - 要领取的 NFT ID（默认为 1）
 */
export async function primusProof(
  walletAddress: string,
  onVerifySuccess?: (attestation: string) => void,
  onClaimSuccess?: (txHash: string) => void,
  onError?: (error: Error) => void,
  nftId: number = 1
) {
    try {
        // 验证钱包地址是否有效
        if (!walletAddress) {
            throw new Error('钱包地址不能为空，请先连接钱包');
        }

        // Set TemplateID and user address.
        const attTemplateID = "2e3160ae-8b1e-45e3-8c59-426366278b9d";
        // 使用传入的钱包地址
        const userAddress = walletAddress;
        
        // Generate attestation request.
        const request = primusZKTLS.generateRequestParams(attTemplateID, userAddress);
        request.setAttConditions([
          [
            {
              type: "CONDITION_EXPANSION",
              op: "MATCH_ONE",
              key: "login",
              field: "$[0].data.currentUser.subscriptionBenefits.edges[*]+",
              value: [
                {
                  type: "FIELD_RANGE",
                  op: "STREQ",
                  field: "+.node.user.login",
                },
              ],
            },
          ],
        ]);

        request.setAttMode({
            algorithmType: "proxytls"
        });

        // Transfer request object to string.
        const requestStr = request.toJsonString();

        // Sign request.
        const signedRequestStr = await primusZKTLS.sign(requestStr);

        // Start attestation process.
        message.loading('正在进行 ZK-TLS 验证...', 0);
        const attestation = await primusZKTLS.startAttestation(signedRequestStr);
        console.log("attestation=", attestation);

        // Verify signature.
        const verifyResult = await primusZKTLS.verifyAttestation(attestation)
        console.log("verifyResult=", verifyResult);

        message.destroy();

        if (verifyResult) {
            console.log('🎉 Primus 验证成功！');
            message.success('✅ ZK-TLS 验证成功！');
            
            // 调用验证成功回调
            if (onVerifySuccess) {
                onVerifySuccess(attestation);
            }

            // 检查是否有以太坊钱包环境
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    console.log('开始自动领取 NFT...');
                    message.loading('正在自动领取 KUNKUN NFT...', 0);
                    
                    // 自动调用 claimKunkunNFT，使用传入的钱包地址
                    const claimResult = await claimKunkunNFT(
                        attestation,
                        nftId,
                        walletAddress,
                        (txHash) => {
                            // 领取成功
                            console.log('🎉 NFT 领取成功！交易哈希:', txHash);
                            if (onClaimSuccess) {
                                onClaimSuccess(txHash);
                            }
                        },
                        (error) => {
                            // 领取失败
                            console.error('❌ NFT 领取失败:', error);
                            if (onError) {
                                onError(error);
                            }
                        }
                    );
                    
                    return claimResult;
                    
                } catch (walletError) {
                    console.error('钱包操作失败:', walletError);
                    message.error('钱包操作失败，请检查钱包连接');
                    if (onError) {
                        onError(new Error('钱包操作失败'));
                    }
                }
            } else {
                const error = new Error('未检测到以太坊钱包，请安装 MetaMask 或 OKX 钱包');
                console.error(error.message);
                message.error(error.message);
                if (onError) {
                    onError(error);
                }
            }
        } else {
            const error = new Error('ZK-TLS 验证失败');
            console.error('❌ Primus 验证失败');
            message.error('❌ ZK-TLS 验证失败，请重试');
            if (onError) {
                onError(error);
            }
        }
        
    } catch (error: any) {
        message.destroy();
        console.error('Primus 验证过程中发生错误:', error);
        message.error('验证过程中发生错误：' + (error.message || '请重试'));
        if (onError) {
            onError(error);
        }
    }
}