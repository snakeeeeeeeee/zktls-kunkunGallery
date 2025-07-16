import { useState, useCallback, useMemo } from 'react';
import { Layout, Modal, Button, message } from 'antd';
import { GiftOutlined, TrophyOutlined } from '@ant-design/icons';
import { ConnectButton, Connector, useAccount } from "@ant-design/web3";
import { 
  MetaMask, 
  OkxWallet, 
  WagmiWeb3ConfigProvider 
} from "@ant-design/web3-wagmi";
import { mainnet } from 'viem/chains';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import NFTGallery from './NFTGallery';
import LotteryGrid from './LotteryGrid';
import './MainPage.css';

const { Header, Content } = Layout;

// 创建稳定的配置对象
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

function MainPageContent() {
  const [lotteryVisible, setLotteryVisible] = useState(false);
  const account = useAccount();
  
  // 使用useCallback避免重复渲染
  const handleLotteryClick = useCallback(() => {
    console.log('抽奖按钮被点击');
    console.log('完整账户信息:', account);
    console.log('钱包连接状态:', account?.account?.status === 'connected');
    console.log('钱包地址:', account?.account?.address);
    console.log('连接状态:', account?.account?.status);
    
    if (account?.account?.status !== 'connected') {
      message.warning('请先连接钱包才能参与抽奖！');
      return;
    }
    
    console.log('显示抽奖弹窗');
    setLotteryVisible(true);
  }, [account]);

  const handleLotteryClose = useCallback(() => {
    setLotteryVisible(false);
  }, []);

  return (
    <Layout className="main-layout">
      <Header className="main-header">
        <div className="header-content">
          <div className="logo">
            <TrophyOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <span className="logo-text">KUNKUN Gallery</span>
          </div>
          
          <div className="wallet-section">
            <Connector
              modalProps={{
                mode: 'simple',
              }}
            >
              <ConnectButton 
                quickConnect 
                style={{
                  borderRadius: '8px',
                  height: '40px',
                  fontWeight: '500'
                }}
              />
            </Connector>
          </div>
        </div>
      </Header>

      <Content className="main-content">
        <NFTGallery />
        
        {/* 悬浮抽奖按钮组 */}
        <div className="floating-lottery-group">
          {/* 动态提示语 */}
          <div className="lottery-tooltip">
            <span className="tooltip-text">请链接钱包抽取KUNKUN</span>
            <div className="tooltip-arrow"></div>
          </div>
          
          {/* 抽奖按钮 */}
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<GiftOutlined />}
            onClick={handleLotteryClick}
            className="floating-lottery-btn"
            title="点击抽奖"
          />
        </div>

        <Modal
          title={
            <div className="lottery-modal-title">
              <GiftOutlined style={{ color: '#1890ff', marginRight: 8 }} />
              KUNKUN抽奖
            </div>
          }
          open={lotteryVisible}
          onCancel={handleLotteryClose}
          footer={null}
          width={680}
          centered
          className="lottery-modal"
          destroyOnClose
        >
          <LotteryGrid />
        </Modal>
      </Content>
    </Layout>
  );
}

function MainPage() {
  // 使用useMemo缓存wallets配置
  const wallets = useMemo(() => [
    OkxWallet(),
    MetaMask(),
  ], []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiWeb3ConfigProvider
        config={wagmiConfig}
        eip6963={{
          autoAddInjectedWallets: true,
        }}
        chains={[mainnet]}
        transports={{
          [mainnet.id]: http(),
        }}
        wallets={wallets}
        queryClient={queryClient}
      >
        <MainPageContent />
      </WagmiWeb3ConfigProvider>
    </QueryClientProvider>
  );
}

export default MainPage;