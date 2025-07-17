import { useState, useCallback, useEffect } from 'react';
import { Layout, Modal, Button, App } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import NFTGallery from './NFTGallery';
import LotteryGrid from './LotteryGrid';
import { config } from './wagmi';
import { switchToMonadTestnet } from './config';
import './MainPage.css';
import '@rainbow-me/rainbowkit/styles.css';

// Import images
import turntableGif from './assets/turntable.gif';

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

// RainbowKit 会自动处理钱包管理，不需要手动初始化

function MainPageContent() {
  const [lotteryVisible, setLotteryVisible] = useState(false);
  const account = useAccount();
  const { switchChain } = useSwitchChain();
  const { message } = App.useApp();

  // 监听钱包连接状态，自动切换网络
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (account?.status === 'connected' && account.chainId !== 10143) {
        console.log('钱包已连接，当前网络:', account.chainId, '需要切换到 Monad 测试网...');
        
        // 显示友好的提示信息
        message.info('检测到您当前不在 Monad 测试网，正在为您切换网络...', 3);
        
        try {
          await switchChain({ chainId: 10143 });
          message.success('✅ 已成功切换到 Monad 测试网');
        } catch (error: any) {
          console.error('RainbowKit 网络切换失败:', error);
          
          // 如果用户拒绝了切换请求
          if (error?.code === 4001 || error?.message?.includes('User rejected')) {
            message.warning('⚠️ 您取消了网络切换，请手动切换到 Monad 测试网以使用完整功能');
            return;
          }
          
          // 尝试使用传统方法作为备选
          try {
            console.log('尝试使用传统方法切换网络...');
            const switched = await switchToMonadTestnet();
            if (switched) {
              message.success('✅ 已成功切换到 Monad 测试网');
            } else {
              message.warning('⚠️ 自动切换失败，请手动切换到 Monad 测试网');
            }
          } catch (fallbackError) {
            console.error('备用网络切换也失败:', fallbackError);
            message.error('❌ 网络切换失败，请手动在钱包中切换到 Monad 测试网');
          }
        }
      } else if (account?.status === 'connected' && account.chainId === 10143) {
        console.log('✅ 已在 Monad 测试网');
        message.success('✅ 当前已连接到 Monad 测试网', 2);
      }
    };

    // 只在钱包状态变化时执行，避免重复执行
    if (account?.status === 'connected') {
      handleWalletConnection();
    }
  }, [account?.status, account?.chainId, switchChain, message]);

  // 使用useCallback避免重复渲染
  const handleLotteryClick = useCallback(() => {
    console.log('抽奖按钮被点击');
    console.log('完整账户信息:', account);
    console.log('钱包连接状态:', account?.status === 'connected');
    console.log('钱包地址:', account?.address);
    console.log('连接状态:', account?.status);

    if (account?.status !== 'connected') {
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
            <ConnectButton />
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
              src={turntableGif}
              alt="抽奖"
              className="turntable-icon"
            />
          </Button>
        </div>

        <Modal
          title={
            <div className="lottery-modal-title">
              <img
                src={turntableGif}
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
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App>
            <MainPageContent />
          </App>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MainPage;