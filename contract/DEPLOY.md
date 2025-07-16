# ClaimNFT 合约部署指南

## 前置条件

1. 安装 Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. 安装依赖
```bash
cd contract
forge install
```

3. 构建
```shell
forge build
```

4. 更新ABI
```shell
cat out/NFTClaim.sol/NFTClaim.json | jq '.abi' > ../app/contracts/NFTClaim.abi.json
```

5. 部署合约后更新config.ts中的合约地址
```text
CONTRACT_ADDRESS=xxx
```


## 部署步骤

### 1. 基本部署（使用默认参数）

部署到 Monad 测试网：
```bash
forge script script/DeployClaimNFT.s.sol:DeployClaimNFTScript \
    --rpc-url monad_testnet \
    --private-key ${privateKey} \
    --broadcast
```

默认参数：
- **NFT Name**: "KUNKUN Collection"
- **NFT Symbol**: "KUNKUN"
- **Primus Address**: `0x1Ad7fD53206fDc3979C672C0466A1c48AF47B431` (Monad Testnet)
- **Base URI**: "https://orange-cautious-dove-71.mypinata.cloud/ipfs/bafybeiesqqbceq2r7jpgcysxmclc4w2ohrsw4z7lqicdcgpwwwjg4xf7y4/"

### 2. 自定义参数部署

#### 方法1：自定义 Primus 地址和 Base URI
```bash
forge script script/DeployClaimNFT.s.sol:DeployClaimNFTScript \
    --sig "run(address,string)" \
    0xYourPrimusAddress \
    "https://your-api.com/metadata/" \
    --rpc-url monad_testnet \
    --account <your-account-name> \
    --sender <your-address> \
    --broadcast \
    --verify
```

#### 方法2：完全自定义参数
```bash
forge script script/DeployClaimNFT.s.sol:DeployClaimNFTScript \
    --sig "run(string,string,address,string)" \
    "Your NFT Name" \
    "SYMBOL" \
    0xYourPrimusAddress \
    "https://your-api.com/metadata/" \
    --rpc-url monad_testnet \
    --account <your-account-name> \
    --sender <your-address> \
    --broadcast \
    --verify
```

### 3. 其他网络部署

#### 部署到本地测试网络
```bash
# 启动本地节点
anvil

# 部署
forge script script/DeployClaimNFT.s.sol:DeployClaimNFTScript \
    --rpc-url http://localhost:8545 \
    --private-key ${privateKey} \
    --broadcast
```

#### 部署到其他网络
在 `foundry.toml` 中添加网络配置：
```toml
[rpc_endpoints]
your_network = "https://your-rpc-url"
```

然后使用相应的 `--rpc-url your_network`

## 账户管理

### 创建新账户
```bash
cast wallet new
```

### 导入现有私钥
```bash
cast wallet import <account-name> --interactive
```

### 查看账户
```bash
cast wallet list
```

## 验证部署

### 1. 检查合约状态
```bash
# 检查总供应量
cast call <contract-address> "TOTAL_SUPPLY()" --rpc-url monad_testnet

# 检查最大NFT ID
cast call <contract-address> "MAX_NFT_ID()" --rpc-url monad_testnet

# 检查Primus地址
cast call <contract-address> "primusAddress()" --rpc-url monad_testnet

# 检查已领取数量
cast call <contract-address> "totalClaimed()" --rpc-url monad_testnet
```


## 合约功能

### 主要功能
- **claimNFT**: 使用ZK-TLS验证领取NFT
- **setPrimusAddress**: 更新Primus验证地址（仅owner）
- **setBaseURI**: 更新metadata URI（仅owner）

### 查询功能
- **getClaimedCount**: 查看特定NFT ID的领取数量
- **getRemainingSupply**: 查看剩余供应量
- **getUserTokens**: 查看用户拥有的所有NFT

## 重要配置

### 合约常量
- **TOTAL_SUPPLY**: 1000 (总供应量)
- **MAX_NFT_ID**: 8 (最大NFT类型ID)

### 网络配置
- **Monad Testnet RPC**: https://testnet-rpc.monad.xyz
- **Monad Testnet Primus**: 0x1Ad7fD53206fDc3979C672C0466A1c48AF47B431

## 故障排除

### 常见错误
1. **"Invalid Primus address"**: 确保Primus地址不是零地址
2. **"Already claimed"**: 用户已经领取过NFT
3. **"All NFTs have been claimed"**: 总供应量已达上限
4. **"Invalid NFT ID"**: NFT ID超过最大值(8)

### 获取帮助
- Foundry文档: https://book.getfoundry.sh/

