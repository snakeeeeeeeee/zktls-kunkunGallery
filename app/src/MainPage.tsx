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
import leftGif from './assets/left.gif';

// 弹跳球特效组件
function BouncingTurntables() {
  const [balls, setBalls] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    rotation: number;
    rotationSpeed: number;
  }>>([]);

  useEffect(() => {
    // 初始化弹跳球
    const initialBalls = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // 10% - 90% 避免贴边
      y: Math.random() * 60 + 20, // 20% - 80% 避免贴边
      vx: (Math.random() - 0.5) * 2, // 水平速度 -1 到 1
      vy: (Math.random() - 0.5) * 2, // 垂直速度 -1 到 1
      size: Math.random() * 30 + 40, // 40-70px
      opacity: Math.random() * 0.4 + 0.3, // 0.3-0.7 透明度
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 10, // 旋转速度
    }));
    setBalls(initialBalls);

    // 动画循环
    const animate = () => {
      setBalls(prevBalls => 
        prevBalls.map(ball => {
          let newX = ball.x + ball.vx;
          let newY = ball.y + ball.vy;
          let newVx = ball.vx;
          let newVy = ball.vy;

          // 边界碰撞检测和反弹
          if (newX <= 0 || newX >= 95) {
            newVx = -ball.vx;
            newX = Math.max(0, Math.min(95, newX));
          }
          if (newY <= 5 || newY >= 90) {
            newVy = -ball.vy;
            newY = Math.max(5, Math.min(90, newY));
          }

          return {
            ...ball,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: ball.rotation + ball.rotationSpeed,
          };
        })
      );
    };

    const animationId = setInterval(animate, 50); // 20fps

    return () => clearInterval(animationId);
  }, []);

  return (
    <div className="bouncing-turntables">
      {balls.map((ball) => (
        <div
          key={ball.id}
          className="bouncing-ball"
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
            width: `${ball.size}px`,
            height: `${ball.size}px`,
            opacity: ball.opacity,
            transform: `rotate(${ball.rotation}deg)`,
          }}
        >
          <img
            src={turntableGif}
            alt="弹跳转盘"
            className="bouncing-turntable-gif"
          />
        </div>
      ))}
    </div>
  );
}

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
        {/* 左右背景填充 */}
        <div className="side-backgrounds">
          <div className="left-background">
            <img src={leftGif} alt="左侧背景" className="background-gif" />
          </div>
          <div className="right-background">
            <img src={leftGif} alt="右侧背景" className="background-gif" />
          </div>
        </div>

        {/* 弹跳转盘特效 */}
        <BouncingTurntables />

        <NFTGallery />

        {/* 游戏规则和使用说明 */}
        <div className="game-rules-section">
          <div className="rules-container">
            <div className="rules-header">
              <h2 className="rules-title">🎮 欢迎来到 KUNKUN 的世界！</h2>
              <p className="rules-subtitle">这里是KUNKUN的聚集地，如果你也是IKUN，就来认领你的KUNKUN NFT吧！</p>
            </div>
            
            <div className="rules-content">
              <div className="rule-item">
                <div className="rule-icon">🔗</div>
                <div className="rule-text">
                  <h3>连接钱包</h3>
                  <p>首先连接你的Web3钱包，系统会自动切换到Monad测试网</p>
                </div>
              </div>
              
              <div className="rule-item">
                <div className="rule-icon">🎰</div>
                <div className="rule-text">
                  <h3>抽取KUNKUN</h3>
                  <p>点击右下角的转盘按钮，开启KUNKUN大转盘抽取你的专属NFT</p>
                </div>
              </div>
              
              <div className="rule-item">
                <div className="rule-icon">🎯</div>
                <div className="rule-text">
                  <h3>认领NFT</h3>
                  <p>转盘停止后，点击对应格子即可认领你的KUNKUN NFT到钱包</p>
                </div>
              </div>
              
              <div className="rule-item">
                <div className="rule-icon">🏆</div>
                <div className="rule-text">
                  <h3>收集展示</h3>
                  <p>收集不同稀有度的KUNKUN，在画廊中展示你的NFT收藏</p>
                </div>
              </div>
            </div>
            
            <div className="rules-footer">
              <p className="footer-text">
                💡 <strong>小贴士：</strong>每个KUNKUN都有不同的稀有度和特殊属性，快来收集你的专属KUNKUN吧！
              </p>
            </div>
          </div>
        </div>

        {/* 悬浮抽奖按钮组 */}
        <div className="floating-lottery-group">
          {/* 动态提示语 */}
          <div className="lottery-tooltip">
            <span className="tooltip-text">🎰 点击认领你的KUNKUN</span>
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
              KUNKUN大转盘
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