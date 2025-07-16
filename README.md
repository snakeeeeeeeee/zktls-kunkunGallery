# Primus Project

## 项目结构

```
primus_project/
├── app/                          # 前端应用
│   ├── src/                      # React 组件和逻辑
│   ├── contracts/                # 合约 ABI 文件
│   │   └── NFTClaim.abi.json    # NFT 合约 ABI
│   ├── index.html               # 入口 HTML
│   ├── package.json             # 前端依赖
│   ├── vite.config.ts           # Vite 配置
│   └── tsconfig.*.json          # TypeScript 配置
├── contract/                     # 智能合约
│   ├── src/                     # 合约源码
│   │   ├── NFTClaim.sol         # NFT 领取合约
│   │   └── JsonParser.sol       # JSON 解析库
│   ├── script/                  # 部署脚本
│   │   └── DeployClaimNFT.s.sol # 部署脚本
│   ├── foundry.toml             # Foundry 配置
│   └── lib/                     # 合约依赖
└── mpt.txt                      # Merkle Proof Tree 数据

```

## 快速开始

### 1. 合约部署

```bash
cd contract
forge build
forge script script/DeployClaimNFT.s.sol:DeployClaimNFTScript \
    --rpc-url monad_testnet \
    --private-key YOUR_PRIVATE_KEY \
    --broadcast
```

### 2. 前端开发

```bash
cd app
npm install
npm run dev
```

## 功能特性

- **NFT 领取**: 支持 ZK-TLS 验证的 NFT 领取功能
- **Web3 集成**: 连接钱包和区块链交互
- **抽奖机制**: NFT 抽奖功能

## 技术栈

### 前端
- React + TypeScript
- Vite
- Web3 相关库

### 合约
- Solidity 0.8.20
- Foundry
- OpenZeppelin
- Primus ZK-TLS

## 网络配置

- **Monad 测试网**: https://testnet-rpc.monad.xyz
- **合约地址**: 部署后更新

## 开发说明

1. 合约修改后需要重新生成 ABI：
   ```bash
   cd contract
   forge build
   cat out/NFTClaim.sol/NFTClaim.json | jq '.abi' > ../app/contracts/NFTClaim.abi.json
   ```

2. 前端会自动读取 `app/contracts/` 目录下的 ABI 文件

3. 确保在正确的网络上进行测试和部署 