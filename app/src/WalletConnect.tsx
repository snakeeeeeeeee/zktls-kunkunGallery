import { useEffect } from "react";
import { Layout } from "antd";
import { ConnectButton, Connector } from "@ant-design/web3";
import { 
  MetaMask, 
  OkxWallet, 
  WagmiWeb3ConfigProvider 
} from "@ant-design/web3-wagmi";
import { QueryClient } from "@tanstack/react-query";
import { http } from "wagmi";
import { monadTestnet } from './config';
import "./WalletConnect.css";

const { Header } = Layout;

const queryClient = new QueryClient();

function WalletConnector() {
  useEffect(() => {
    // 检查可用的钱包
    const checkAvailableWallets = () => {
      const wallets = [];
      
      // 检查 OKX (优先)
      if (typeof window !== 'undefined' && window.okxwallet) {
        wallets.push('OKX');
      }
      
      // 检查 MetaMask
      if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
        wallets.push('MetaMask');
      }
      
      // 检查其他注入的钱包
      if (typeof window !== 'undefined' && window.ethereum && !window.ethereum.isMetaMask) {
        wallets.push('通用钱包');
      }
      
      console.log('检测到的钱包:', wallets);
      console.log('推荐使用 OKX 钱包连接 Monad 测试网');
    };
    
    checkAvailableWallets();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '0 24px'
      }}>

        <Connector
          modalProps={{
            mode: 'simple',
          }}
        >
          <ConnectButton quickConnect />
        </Connector>
      </Header>
    </Layout>
  );
}

function WalletConnect() {
  return (
    <WagmiWeb3ConfigProvider
      eip6963={{
        autoAddInjectedWallets: true,
      }}
      chains={[monadTestnet]}
      transports={{
        [monadTestnet.id]: http(),
      }}
      wallets={[
        OkxWallet(),
        MetaMask(),
      ]}
      queryClient={queryClient}
    >
      <WalletConnector />
    </WagmiWeb3ConfigProvider>
  );
}

export default WalletConnect;