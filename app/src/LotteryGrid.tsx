import { useState } from 'react';
import { Button, Modal, Typography, Card, message } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
import { useAccount } from "@ant-design/web3";
import { claimKunkunNFT } from './claim';
import './LotteryGrid.css';

// Import local images
import img1 from './assets/1.jpeg';
import img2 from './assets/2.jpeg';
import img3 from './assets/3.jpeg';
import img4 from './assets/4.jpeg';
import img5 from './assets/5.jpeg';
import img6 from './assets/6.jpeg';
import img7 from './assets/7.jpeg';
import img8 from './assets/8.jpeg';

const { Title, Text } = Typography;

// X图标组件
const XIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg 
    viewBox="0 0 24 24" 
    style={{ width: '1em', height: '1em', fill: 'currentColor', ...style }}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface Prize {
  id: number;
  name: string;
  image: string;
  probability: number;
}

const prizes: Prize[] = [
  { id: 1, name: '', image: img1, probability: 0.05 },
  { id: 2, name: '', image: img2, probability: 0.1 },
  { id: 3, name: '', image: img3, probability: 0.15 },
  { id: 4, name: '', image: img4, probability: 0.2 },
  { id: 5, name: '', image: img5, probability: 0.08 },
  { id: 6, name: '', image: img6, probability: 0.12 },
  { id: 7, name: '', image: img7, probability: 0.18 },
  { id: 8, name: '', image: img8, probability: 0.12 },
];

const LotteryGrid: React.FC = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [winPrize, setWinPrize] = useState<Prize | null>(null);
  
  // 验证弹窗直接显示
  const [verificationVisible, setVerificationVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<any>(null);
  
  // 领取相关状态
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string>('');
  
  // 获取钱包账户信息
  const account = useAccount();

  const gridPositions = [0, 1, 2, 7, 8, 3, 6, 5, 4];

  const startDraw = () => {
    if (isDrawing) return;
    
    setIsDrawing(true);
    setCurrentIndex(-1);
    
    // 随机选择获奖奖品
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedPrize = prizes[prizes.length - 1]; // 默认最后一个
    
    for (const prize of prizes) {
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        selectedPrize = prize;
        break;
      }
    }
    
    // 计算最终停止位置（对应到九宫格位置）
    const targetPosition = Math.floor(Math.random() * 8);
    
    // 动画效果：快速转动3秒
    let animationIndex = 0;
    let speed = 100;
    let totalTime = 0;
    const duration = 3000; // 3秒
    
    const animate = () => {
      setCurrentIndex(gridPositions[animationIndex % 8]);
      animationIndex++;
      totalTime += speed;
      
      if (totalTime < duration) {
        // 渐慢效果
        if (totalTime > duration * 0.7) {
          speed = Math.min(speed + 20, 300);
        }
        setTimeout(animate, speed);
      } else {
        // 停在目标位置
        setCurrentIndex(gridPositions[targetPosition]);
        setTimeout(() => {
          setIsDrawing(false);
          setWinPrize(selectedPrize);
          // 直接显示验证弹窗
          setVerificationVisible(true);
        }, 500);
      }
    };
    
    animate();
  };

  const handleVerification = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setVerificationError(null);
    
    try {
      // 动态导入 primusProof
      const { primusProof } = await import('./primus');
      
      message.info('正在启动X验证，请在弹出的窗口中完成验证...');
      
      // 使用默认的channel名称或者空字符串
      await primusProof('', (attestation) => {
        console.log('验证成功:', attestation);
        setVerificationResult(attestation);
        message.success('X验证成功！您已获得KUNKUN NFT资格！');
      });
      
    } catch (error: any) {
      console.error('验证失败:', error);
      setVerificationError(error);
      message.error('验证失败：' + (error.message || '未知错误'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaim = async () => {
    if (!account?.account?.address) {
      message.error('请先连接钱包');
      return;
    }

    if (!winPrize) {
      message.error('没有可领取的奖品');
      return;
    }

    setIsClaiming(true);
    
    try {
      const result = await claimKunkunNFT(
        verificationResult,
        winPrize.id,
        account.account.address,
        (txHash) => {
          // 成功回调
          setClaimTxHash(txHash);
          setClaimSuccess(true);
          console.log('领取成功，交易哈希:', txHash);
        },
        (error) => {
          // 失败回调
          console.error('领取失败:', error);
        }
      );

      if (result.success) {
        console.log('NFT领取成功');
      }
    } catch (error) {
      console.error('领取过程出错:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCloseVerification = () => {
    setVerificationVisible(false);
    setVerificationResult(null);
    setVerificationError(null);
    setClaimSuccess(false);
    setClaimTxHash('');
    setWinPrize(null);
    setCurrentIndex(-1);
  };

  const renderGridItem = (position: number) => {
    const isActive = currentIndex === position;
    const isCenter = position === 4; // 中心位置
    
    if (isCenter) {
      return (
        <div 
          key="center" 
          className={`lottery-grid-item center-item ${isDrawing ? 'drawing' : ''}`}
        >
          <Button
            type="primary"
            size="large"
            onClick={startDraw}
            loading={isDrawing}
            disabled={isDrawing}
            className="lottery-button"
            icon={<GiftOutlined />}
          >
            {isDrawing ? '抽奖中...' : '开始抽奖'}
          </Button>
        </div>
      );
    }
    
    const prizeIndex = position > 4 ? position - 1 : position;
    const prize = prizes[prizeIndex];
    
    return (
      <div 
        key={position}
        className={`lottery-grid-item prize-item ${isActive ? 'active' : ''}`}
      >
        <div className="prize-image">
          <img src={prize?.image} alt={prize?.name} className="prize-img" />
        </div>
        <div className="prize-name">{prize?.name}</div>
      </div>
    );
  };

  return (
    <div className="lottery-container">
      <Card className="lottery-card">
        <div className="lottery-grid">
          {Array.from({ length: 9 }, (_, index) => renderGridItem(index))}
        </div>
      </Card>

      {/* X验证和领取弹窗 */}
      <Modal
        title={
          <div className="verification-modal-title">
            <XIcon style={{ color: '#000', marginRight: 8, fontSize: '18px' }} />
            {!verificationResult ? '验证' : claimSuccess ? '领取成功' : '领取 NFT'}
          </div>
        }
        open={verificationVisible}
        onCancel={handleCloseVerification}
        footer={[
          <Button key="cancel" onClick={handleCloseVerification}>
            {claimSuccess ? '关闭' : '取消'}
          </Button>,
          // 根据验证状态显示不同的按钮
          !verificationResult ? (
            <Button 
              key="verify" 
              type="primary" 
              loading={isVerifying}
              onClick={handleVerification}
            >
              验证 <XIcon style={{ marginLeft: 4 }} />
            </Button>
          ) : claimSuccess ? (
            <Button key="claimed" type="default" disabled>
              已领取 ✅
            </Button>
          ) : (
            <Button 
              key="claim" 
              type="primary" 
              loading={isClaiming}
              onClick={handleClaim}
            >
              领取 <GiftOutlined style={{ marginLeft: 4 }} />
            </Button>
          )
        ]}
        className="verification-modal"
        width={450}
        destroyOnClose
      >
        <div className="verification-content">
          {/* 中奖展示区域 */}
          {winPrize && (
            <div className="prize-display">
              <div className="prize-display-image">
                <img src={winPrize.image} alt="中奖奖品" className="prize-display-img" />
              </div>
              <Title level={4} className="prize-display-title">🎉 这是一个超级稀有的KUNKUN！</Title>
            </div>
          )}
          
          <div className="verification-info">
            <Text>
              {!verificationResult ? 
                '为了领取您的KUNKUN NFT，需要验证您的X账户。' :
                claimSuccess ?
                '🎉 恭喜！您的KUNKUN NFT已成功领取到钱包中！' :
                '验证成功！现在可以领取您的KUNKUN NFT了。'
              }
            </Text>
            <br />
            {!verificationResult && (
              <Text type="secondary">
                点击"验证"按钮，系统将通过ZK-TLS技术安全验证您的身份。
              </Text>
            )}
          </div>

          {verificationResult && !claimSuccess && (
            <div className="verification-success">
              <Text type="success" strong>
                ✅ X验证成功！您的KUNKUN NFT资格已确认！
              </Text>
              <br />
              <Text type="secondary">
                现在可以点击"领取"按钮来铸造您的NFT到钱包中。
              </Text>
            </div>
          )}

          {claimSuccess && (
            <div className="claim-success">
              <Text type="success" strong>
                🎉 NFT领取成功！
              </Text>
              <br />
              <Text type="secondary">
                交易哈希: {claimTxHash ? claimTxHash.slice(0, 10) + '...' : ''}
              </Text>
            </div>
          )}

          {verificationError && (
            <div className="verification-error">
              <Text type="danger">
                ❌ 验证失败：{verificationError.message || '请重试'}
              </Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LotteryGrid;