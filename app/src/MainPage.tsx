import { useState, useCallback, useMemo, useEffect } from 'react';
import { Layout, Modal, Button, App } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { ConnectButton, Connector, useAccount } from "@ant-design/web3";
import {
  MetaMask,
  OkxWallet,
  WagmiWeb3ConfigProvider
} from "@ant-design/web3-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import NFTGallery from './NFTGallery';
import LotteryGrid from './LotteryGrid';

import { monadTestnet, switchToMonadTestnet } from './config';
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
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
});

function MainPageContent() {
  const [lotteryVisible, setLotteryVisible] = useState(false);
  const account = useAccount();
  const { message } = App.useApp();

  // 监听钱包连接状态，自动切换网络
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (account?.account?.status === 'connected') {
        console.log('钱包已连接，开始切换到 Monad 测试网...');
        try {
          const switched = await switchToMonadTestnet();
          if (switched) {
            message.success('已切换到 Monad 测试网');
          } else {
            message.warning('请手动切换到 Monad 测试网');
          }
        } catch (error) {
          console.error('网络切换失败:', error);
          message.error('网络切换失败，请手动切换到 Monad 测试网');
        }
      }
    };

    handleWalletConnection();
  }, [account?.account?.status]);

  // 使用useCallback避免重复渲染
  const handleLotteryClick = useCallback(() => {
    console.log('抽奖按钮被点击');
    console.log('完整账户信息:', account);
    console.log('钱包连接状态:', account?.account?.status === 'connected');
    console.log('钱包地址:', account?.account?.address);
    console.log('连接状态:', account?.account?.status);

    if (!account?.account) {
      console.log('钱包未连接，显示提示');
      message.warning('🔗 请先连接钱包才能开启 KUNKUN 盲盒');
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
            <span className="tooltip-text">🎰 开启专属 KUNKUN 盲盒</span>
            <div className="tooltip-arrow"></div>
          </div>

          {/* 抽奖按钮 */}
          <Button
            type="primary"
            shape="circle"
            size="large"
            onClick={handleLotteryClick}
            className="floating-lottery-btn"
            title="开启 KUNKUN 盲盒"
          >
            <img
              src="/src/assets/turntable.gif"
              alt="抽奖"
              className="turntable-icon"
            />
          </Button>
        </div>

        <Modal
          title={
            <div className="lottery-modal-title">
              <img
                src="/src/assets/turntable.gif"
                alt="转盘"
                style={{ width: '20px', height: '20px', marginRight: 8, borderRadius: '50%' }}
              />
              KUNKUN 盲盒抽取
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
  // 使用useMemo缓存wallets配置，OKX优先
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
        chains={[monadTestnet]}
        transports={{
          [monadTestnet.id]: http(),
        }}
        wallets={wallets}
        queryClient={queryClient}
      >
        <App>
          <MainPageContent />
        </App>
      </WagmiWeb3ConfigProvider>
    </QueryClientProvider>
  );
}

export default MainPage;