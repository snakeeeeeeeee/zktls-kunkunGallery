import React, { useState } from 'react';
import { Card, Row, Col, Tag, Typography, Space, Tooltip } from 'antd';
import { EyeOutlined, HeartOutlined } from '@ant-design/icons';
import './NFTGallery.css';

// Import images
import img1 from './assets/1.jpeg';
import img2 from './assets/2.jpeg';
import img3 from './assets/3.jpeg';
import img4 from './assets/4.jpeg';
import img5 from './assets/5.jpeg';
import img6 from './assets/6.jpeg';
import img7 from './assets/7.jpeg';
import img8 from './assets/8.jpeg';

const { Meta } = Card;
const { Text } = Typography;

interface NFTItem {
  id: number;
  name: string;
  image: string;
  tokenId: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  likes: number;
  views: number;
}

const NFTGallery: React.FC = () => {
  const [nftList] = useState<NFTItem[]>([
    {
      id: 1,
      name: 'KUNKUN #1',
      image: img1,
      tokenId: '#1',
      rarity: 'Legendary',
      likes: 156,
      views: 2341
    },
    {
      id: 2,
      name: 'KUNKUN #2',
      image: img2,
      tokenId: '#2',
      rarity: 'Epic',
      likes: 89,
      views: 1567
    },
    {
      id: 3,
      name: 'KUNKUN #3',
      image: img3,
      tokenId: '#3',
      rarity: 'Rare',
      likes: 67,
      views: 1234
    },
    {
      id: 4,
      name: 'KUNKUN #4',
      image: img4,
      tokenId: '#4',
      rarity: 'Common',
      likes: 45,
      views: 892
    },
    {
      id: 5,
      name: 'KUNKUN #5',
      image: img5,
      tokenId: '#5',
      rarity: 'Legendary',
      likes: 203,
      views: 3456
    },
    {
      id: 6,
      name: 'KUNKUN #6',
      image: img6,
      tokenId: '#6',
      rarity: 'Rare',
      likes: 78,
      views: 1678
    },
    {
      id: 7,
      name: 'KUNKUN #7',
      image: img7,
      tokenId: '#7',
      rarity: 'Rare',
      likes: 78,
      views: 1678
    },
    {
      id: 8,
      name: 'KUNKUN #8',
      image: img8,
      tokenId: '#8',
      rarity: 'Rare',
      likes: 78,
      views: 1678
    }
  ]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return '#ff6b35';
      case 'Epic': return '#9d4edd';
      case 'Rare': return '#277da1';
      case 'Common': return '#90a955';
      default: return '#666';
    }
  };

  return (
    <div className="nft-gallery">
{/*      <div className="gallery-header">
        <Title level={2}>KUNKUN</Title>

        <Text type="secondary">A collection of 8,888 unique Pudgy Penguins</Text>

      </div>*/}
      
      <Row gutter={[16, 16]} className="nft-grid">
        {nftList.map((nft) => (
          <Col xs={24} sm={12} md={8} lg={6} key={nft.id}>
            <Card
              hoverable
              className="nft-card"
              cover={
                <div className="nft-image-container">
                  <img 
                    alt={nft.name} 
                    src={nft.image}
                    className="nft-image"
                  />
                  <div className="nft-overlay">
                    <Space>
                      <Tooltip title="Views">
                        <span className="overlay-stat">
                          <EyeOutlined /> {nft.views}
                        </span>
                      </Tooltip>
                      <Tooltip title="Likes">
                        <span className="overlay-stat">
                          <HeartOutlined /> {nft.likes}
                        </span>
                      </Tooltip>
                    </Space>
                  </div>
                </div>
              }
            >
              <Meta
                title={
                  <div className="nft-title">
                    <span>{nft.name}</span>
                    <Tag 
                      color={getRarityColor(nft.rarity)}
                      className="rarity-tag"
                    >
                      {nft.rarity}
                    </Tag>
                  </div>
                }
                description={
                  <div className="nft-details">
                    <Text type="secondary" className="token-id">{nft.tokenId}</Text>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default NFTGallery;