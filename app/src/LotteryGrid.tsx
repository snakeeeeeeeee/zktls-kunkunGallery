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

  // 转盘位置映射：8个奖品位置（不包括中心位置4）
  const gridPositions = [0, 1, 2, 3, 5, 6, 7, 8];

  const startDraw = () => {
    if (isDrawing) return;
    
    setIsDrawing(true);
    setCurrentIndex(-1);
    
    // 随机选择获奖奖品
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedPrize = prizes[prizes.length - 1]; // 默认最后一个
    let selectedPrizeIndex = prizes.length - 1;
    
    for (let i = 0; i < prizes.length; i++) {
      const prize = prizes[i];
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        selectedPrize = prize;
        selectedPrizeIndex = i;
        break;
      }
    }
    
    // 根据奖品索引映射到实际的网格位置
    // 奖品索引 0,1,2,3,4,5,6,7 对应网格位置 0,1,2,3,5,6,7,8
    let targetGridPosition;
    if (selectedPrizeIndex <= 3) {
      targetGridPosition = selectedPrizeIndex; // 0,1,2,3
    } else {
      targetGridPosition = selectedPrizeIndex + 1; // 4,5,6,7 -> 5,6,7,8
    }
    
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
        // 停在目标位置 - 确保停在正确的奖品位置
        setCurrentIndex(targetGridPosition);
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
      // 检查钱包连接状态
      if (!account?.account?.address) {
        message.error('请先连接钱包再进行验证');
        setIsVerifying(false);
        return;
      }

      const walletAddress = account.account.address;
      console.log('当前钱包地址:', walletAddress);

      // 动态导入 primusProof
      const { primusProof } = await import('./primus');
      
      message.info('正在启动 ZK-TLS 验证，请在弹出的窗口中完成验证...');
      
      // 使用用户实际抽到的 NFT ID
      const selectedNftId = winPrize?.id || 1;
      
      await primusProof(
        walletAddress,
        (attestation) => {
          // 验证成功回调
          console.log('验证成功:', attestation);
          setVerificationResult(attestation);
          setIsVerifying(false);
          message.success('✅ ZK-TLS 验证成功！正在自动领取 NFT...');
        },
        (txHash) => {
          // 领取成功回调
          console.log('NFT 领取成功！交易哈希:', txHash);
          setIsClaiming(false);
          setClaimSuccess(true);
          setClaimTxHash(txHash);
          message.success('🎉 KUNKUN NFT 领取成功！');
        },
        (error) => {
          // 错误回调
          console.error('处理失败:', error);
          setIsVerifying(false);
          setIsClaiming(false);
          setVerificationError(error);
          message.error('操作失败：' + error.message);
        },
        selectedNftId // NFT ID
      );
      
    } catch (error: any) {
      console.error('验证过程出错:', error);
      setIsVerifying(false);
      setVerificationError(error);
      message.error('验证失败：' + (error.message || '请重试'));
    }
  };

  // 原来的领取函数现在不需要了，因为 primusProof 会自动领取
  const handleClaim = async () => {
    // 这个函数现在主要用于显示信息，实际领取已经在验证成功后自动完成
    message.info('NFT 已在验证成功后自动领取！');
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
            disabled={isDrawing}
            className="lottery-button"
          >
            {isDrawing ? (
              <img 
                src="/src/assets/lottery.gif" 
                alt="抽奖中" 
                className="lottery-button-icon-drawing"
              />
            ) : (
              <>
                <img 
                  src="/src/assets/lottery.gif" 
                  alt="抽奖" 
                  className="lottery-button-icon"
                />
                开始抽奖
              </>
            )}
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
            <GiftOutlined style={{ color: '#1890ff', marginRight: 8, fontSize: '18px' }} />
            {!verificationResult ? '领取 KUNKUN NFT' : claimSuccess ? '领取成功' : '正在领取'}
          </div>
        }
        open={verificationVisible}
        onCancel={handleCloseVerification}
        footer={[
          <Button key="cancel" onClick={handleCloseVerification}>
            {claimSuccess ? '关闭' : '取消'}
          </Button>,
          // 根据状态显示不同的按钮
          !verificationResult && !claimSuccess ? (
            <Button 
              key="verify" 
              type="primary" 
              loading={isVerifying}
              onClick={handleVerification}
            >
              领取 <GiftOutlined style={{ marginLeft: 4 }} />
            </Button>
          ) : claimSuccess ? (
            <Button key="claimed" type="default" disabled>
              已领取 ✅
            </Button>
          ) : (
            <Button key="processing" type="primary" loading disabled>
              正在处理...
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
                '为了领取您的KUNKUN NFT，需要验证您的Twitter身份并自动铸造到您的钱包。' :
                claimSuccess ?
                '🎉 恭喜！您的KUNKUN NFT已成功领取到钱包中！' :
                '正在处理您的NFT领取请求...'
              }
            </Text>
            <br />
            {!verificationResult && !claimSuccess && (
              <Text type="secondary">
                点击"领取"，系统将通过ZK技术安全验证您的Twitter身份并自动领取NFT。
              </Text>
            )}
          </div>

          {verificationResult && !claimSuccess && (
            <div className="verification-success">
              <Text type="success" strong>
                ✅ 验证成功！正在自动领取您的KUNKUN...
              </Text>
              <br />
              <Text type="secondary">
                请稍候，系统正在自动铸造NFT到您的钱包中。
              </Text>
            </div>
          )}

          {claimSuccess && (
            <div className="claim-success">
              <Text type="success" strong>
                🎉 领取成功！
              </Text>
              <br />

              <br />
              <Text type="secondary">
                您可以在钱包中查看您的KUNKUN NFT！
              </Text>
            </div>
          )}

          {verificationError && (
            <div className="verification-error">
              <Text type="danger">
                ❌ 操作失败：{verificationError.message || '请重试'}
              </Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LotteryGrid;