import React, { useEffect, useState } from 'react'
import request from '../../utils/request';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, InputNumber, Divider, Skeleton, message, Tag, Rate, Tabs, Radio } from 'antd';
import { ShoppingCartOutlined,ShoppingOutlined, HeartOutlined, SafetyCertificateOutlined, RocketOutlined, SyncOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Image } from 'antd'; // 

const ItemDetail = () => {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(''); // 添加选中的尺码状态
  const [messageApi, contextHolder] = message.useMessage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // 使用 useNavigate 钩子

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const res = await request.get('/products');
      // 直接从响应中查找匹配ID的商品
      const foundProduct = res.find((item: any) => item._id === id);
      
      // 添加调试信息
      console.log('API返回的所有商品:', res);
      console.log('找到的商品详情:', foundProduct);
      console.log('商品尺码数据类型:', foundProduct?.size ? typeof foundProduct.size : '无尺码数据');
      console.log('商品尺码内容:', foundProduct?.size);
      
      setProduct(foundProduct);
      
      // 如果商品有尺码，默认选择第一个
      if (foundProduct && foundProduct.size && foundProduct.size.length > 0) {
        setSelectedSize(foundProduct.size[0]);
        console.log('默认选择尺码:', foundProduct.size[0]);
      }
      
      console.log('找到商品:', foundProduct);
    } catch (error) {
      console.error('获取商品详情失败:', error);
      messageApi.error('获取商品详情失败'); // 修改这里，使用 messageApi 而不是 message
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('ItemDetail 组件已渲染，ID:', id);
    loadProductDetail();
  }, [id]);

  // 修改加入购物车函数，实现与后端的交互
  const handleAddToCart = async () => {
    console.log('添加到购物车，商品ID:', id);
    console.log('选择的尺码:', selectedSize);
    console.log('商品尺码选项:', product?.size);
    
    // 检查是否需要选择尺码但未选择
    if (product.size && product.size.length > 0 && !selectedSize) {
      messageApi.warning('请先选择尺码');
      return;
    }
    
    try {
      // 显示加载中消息
      const loadingMsg = messageApi.loading('正在添加到购物车...', 0);
      
      // 发送请求添加到购物车，包含尺码信息
      const cartData = {
        productId: id,
        quantity: quantity,
        size: selectedSize // 添加尺码信息
      };
      
      console.log('发送购物车数据:', cartData);
      
      await request.post('/cart', cartData);
      
      // 关闭加载消息
      loadingMsg();
      
      // 显示成功消息
      messageApi.success(`已将 ${quantity} 件 ${product?.name} ${selectedSize ? `(${selectedSize})` : ''} 加入购物车`);
    } catch (error) {
      console.error('添加购物车失败:', error);
      messageApi.error('添加购物车失败，请稍后重试');
    }
  };

  // 处理尺码选择变化
  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('选择尺码:', e.target.value);
    setSelectedSize(e.target.value);
  };

  // 添加返回上一页的处理函数
  const handleGoBack = () => {
    navigate(-1); // 返回上一页
  };

  if (loading) {
    return (
      <Card className="shadow-md rounded-lg overflow-hidden">
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!product) {
    return (
      <Card className="shadow-md rounded-lg text-center">
        <div className="py-10">
          <h2 className="text-xl text-red-500 font-bold mb-2">未找到该商品</h2>
          <p className="text-gray-500">商品ID: {id} 不存在或已下架</p>
          <Button type="primary" className="mt-4" onClick={handleGoBack}>
            返回上一页
          </Button>
        </div>
      </Card>
    );
  }

  const items = [
    {
      key: '1',
      label: '商品详情',
      children: (
        <div className="py-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4 text-primary">产品介绍</h3>
            <p className="text-gray-700 leading-relaxed">
              {product.name} 是一款高端{product.type}，采用顶级工艺打造，具有卓越的性能和精美的外观设计。
              这款产品无论是日常使用还是特殊场合，都能满足您的需求，带来出色的使用体验。
            </p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <SafetyCertificateOutlined className="text-primary text-xl mr-2" />
                  <h4 className="font-bold">品质保证</h4>
                </div>
                <p className="text-gray-600 text-sm">采用高品质材料，经过严格质检</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <RocketOutlined className="text-primary text-xl mr-2" />
                  <h4 className="font-bold">极速配送</h4>
                </div>
                <p className="text-gray-600 text-sm">下单后24小时内发货，闪电送达</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <SyncOutlined className="text-primary text-xl mr-2" />
                  <h4 className="font-bold">无忧退换</h4>
                </div>
                <p className="text-gray-600 text-sm">7天无理由退换，售后无忧</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-bold mb-4 text-primary">产品规格</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 bg-gray-50 font-medium w-1/4">品牌</td>
                  <td className="py-3 px-4">{product.name.split(' ')[0]}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 bg-gray-50 font-medium">型号</td>
                  <td className="py-3 px-4">{product.name}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 bg-gray-50 font-medium">类型</td>
                  <td className="py-3 px-4">{product.type}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 bg-gray-50 font-medium">保修期</td>
                  <td className="py-3 px-4">12个月</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      key: '2',
      label: '用户评价',
      children: (
        <div className="py-4">
          <div className="flex items-center mb-6">
            <div className="text-3xl font-bold text-primary mr-4">4.8</div>
            <div>
              <Rate disabled defaultValue={4.8} allowHalf />
              <div className="text-gray-500 text-sm mt-1">共 126 条评价</div>
            </div>
          </div>
          
          <Divider />
          
          {[1, 2, 3].map((item) => (
            <div key={item} className="mb-6 pb-6 border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-2">
                    {item === 1 ? 'L' : item === 2 ? 'W' : 'Z'}
                  </div>
                  <span className="font-medium">用户{item === 1 ? 'Liu' : item === 2 ? 'Wang' : 'Zhang'}</span>
                </div>
                <Rate disabled defaultValue={5} />
              </div>
              <p className="text-gray-700">
                {item === 1 
                  ? `${product.name}非常好用，外观设计很漂亮，性能也很强大，非常满意这次购买！` 
                  : item === 2 
                    ? '收到货后非常惊喜，包装很精美，商品质量很好，强烈推荐！' 
                    : '客服态度很好，发货速度快，产品和描述一致，会继续支持！'}
              </p>
              <div className="text-gray-400 text-sm mt-2">
                {`2023-${item + 9}-${item * 10}`}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {contextHolder} {/* 添加这一行，渲染 contextHolder */}
      
      {/* 添加返回按钮 */}
      <div className="flex items-center mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleGoBack}
          className="flex items-center ml-2 mt-2"
        >
          返回首页
        </Button>
      </div>
      
      <Card className="shadow-md rounded-lg overflow-hidden">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg flex items-center justify-center h-64 sm:h-96">
              <Image
                src={product.picURL}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
                style={{ maxHeight: '320px', maxWidth: '100%' }}
                preview={{
                  mask: <span style={{ fontSize: 16 }}>点击放大</span>,
                }}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="h-full flex flex-col">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <div className="flex items-center mt-2 mb-4">
                <Rate disabled defaultValue={4.8} allowHalf className="text-sm" />
                <span className="text-gray-500 ml-2 text-sm">4.8 (126条评价)</span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <div className="text-primary text-3xl font-bold">¥{product.price}</div>
                <div className="text-gray-500 text-sm mt-1">市场价: ¥{(product.price * 1.2).toFixed(2)}</div>
              </div>
              
              <div className="flex items-center mb-4">
                <Tag color="orange" className="mr-2">{product.type}</Tag>
                <Tag color="green">有货</Tag>
                <Tag color="blue" className="ml-2">包邮</Tag>
              </div>
              
              <Divider />
              
              {/* 添加尺码选择 */}
              {product.size && product.size.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center">
                    <span className="mr-4 text-gray-700">尺码:</span>
                    <Radio.Group 
                      onChange={handleSizeChange} 
                      value={selectedSize}
                      className="flex flex-wrap"
                    >
                      {product.size.map((size: string) => (
                        <Radio.Button 
                          key={size} 
                          value={size}
                          className="mr-2 mb-2"
                        >
                          {size}
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </div>
                </div>
              )}
              
              <div className="flex items-center mb-4">
                <span className="mr-4 text-gray-700">数量:</span>
                <InputNumber 
                  min={1} 
                  max={product.stock} 
                  defaultValue={1} 
                  onChange={(value) => setQuantity(value as number)} 
                  className="w-20"
                />
                <span className="ml-2 text-gray-400">库存 {product.stock} 件</span>
              </div>
              
              <div className="flex space-x-4 mt-auto">
                <Button 
                  variant="solid"
                  size="large" 
                  icon={<ShoppingOutlined />}
                  color="danger"
                  className="flex items-center"
                  block
                >
                  立即购买
                </Button>
                <Button 
                  color="danger"
                  variant="outlined"
                  size="large" 
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  className="flex items-center"
                  block
                >
                  加入购物车
                </Button>
                <Button 
                  size="large" 
                  icon={<HeartOutlined />}
                  className="flex-shrink-0"
                >
                  收藏
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
      
      <Card className="shadow-md rounded-lg">
        <Tabs defaultActiveKey="1" items={items} />
      </Card>
    </div>
  );
};

export default ItemDetail;