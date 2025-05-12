import React, { useEffect, useState } from 'react';
import { Card, List, Button, InputNumber, Empty, Skeleton, message, Divider, Space, Popconfirm, Statistic, Row, Col, Checkbox, Tag, Radio, Popover } from 'antd';
import { DeleteOutlined, ShoppingOutlined, ExclamationCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import { useNavigate } from 'react-router-dom';

const ShopCar = () => {
  const [cart, setCart] = useState<any>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // 存储选中的商品ID
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  
  // 添加商品尺码状态
  const [productSizes, setProductSizes] = useState<Record<string, string[]>>({});
  
  
  // 获取购物车数据
  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await request.get('/cart');
      console.log('获取到的购物车数据:', data);
      setCart(data);
      
      // 默认全选
      if (data && data.items && data.items.length > 0) {
        setSelectedItems(data.items.map((item: any) => item._id));
        
        // 获取所有商品的尺码信息
        fetchProductSizes(data.items);
      } else {
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('获取购物车失败:', error);
      messageApi.error('获取购物车失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取所有商品的尺码信息
  const fetchProductSizes = async (items: any[]) => {
    try {
      const products = await request.get('/products');
      const sizesMap: Record<string, string[]> = {};
      
      items.forEach((item: any) => {
        const product = products.find((p: any) => p._id === item.productId);
        if (product && product.size && Array.isArray(product.size)) {
          sizesMap[item.productId] = product.size;
        }
      });
      
      setProductSizes(sizesMap);
      console.log('获取到的商品尺码信息:', sizesMap);
    } catch (error) {
      console.error('获取商品尺码信息失败:', error);
    }
  };
  
  // 添加更新尺码的函数
  const updateSize = async (itemId: string, size: string) => {
    try {
      await request.put(`/cart/${itemId}`, { size });
      messageApi.success('尺码已更新');
      fetchCart(); // 重新获取购物车数据
    } catch (error) {
      console.error('更新尺码失败:', error);
      messageApi.error('更新尺码失败');
    }
  };
  
  useEffect(() => {
    fetchCart();
  }, []);

  // 删除商品
  const removeItem = async (itemId: string) => {
    try {
      console.log('确认删除商品ID:', itemId);
      await request.delete(`/cart/${itemId}`);
      messageApi.success('商品已从购物车中删除');
      
      // 从选中列表中移除
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      
      fetchCart(); // 重新获取购物车数据
    } catch (error) {
      console.error('删除失败:', error);
      messageApi.error('删除失败');
    }
  };

  // 更新数量
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!quantity || quantity < 1) {
      messageApi.warning('商品数量不能小于1');
      return;
    }
    
    try {
      await request.put(`/cart/${itemId}`, { quantity });
      messageApi.success('商品数量已更新');
      fetchCart(); // 重新获取购物车数据
    } catch (error) {
      console.error('更新数量失败:', error);
      messageApi.error('更新数量失败');
    }
  };

  // 清空购物车
  const clearCart = async () => {
    try {
      console.log('开始清空购物车...');
      // 确保路径与后端匹配，检查是否需要添加 /api 前缀
      const response = await request.delete('/cart/clear');
      console.log('清空购物车响应:', response);
      
      if (response && response.message) {
        messageApi.success(response.message);
      } else {
        messageApi.success('购物车已清空');
      }
      
      setSelectedItems([]); // 清空选中项
      setCart({ items: [] }); // 直接在前端清空购物车数据
      
      // 延迟一下再重新获取购物车数据，确保后端处理完成
      setTimeout(() => {
        fetchCart(); // 重新获取购物车数据
      }, 300);
    } catch (error) {
      console.error('清空购物车失败:', error);
      messageApi.error('清空购物车失败，请稍后再试');
    }
  };

  // 处理单个商品选择
  const handleItemSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(cart.items.map((item: any) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  // 计算选中商品的总价
  const calculateSelectedTotal = () => {
    return cart.items
      .filter((item: any) => selectedItems.includes(item._id))
      .reduce((total: number, item: any) => {
        return total + (item.price * item.quantity);
      }, 0);
  };

  // 计算选中商品的总数量
  const calculateSelectedCount = () => {
    return cart.items
      .filter((item: any) => selectedItems.includes(item._id))
      .reduce((total: number, item: any) => {
        return total + item.quantity;
      }, 0);
  };

  // 结算
  const checkout = () => {
    if (selectedItems.length === 0) {
      messageApi.warning('请先选择要结算的商品');
      return;
    }
    
    // 获取选中的商品信息，用于展示
    const selectedProducts = cart.items
      .filter((item: any) => selectedItems.includes(item._id))
      .map((item: any) => `${item.name} ${item.size ? `(${item.size})` : ''} x ${item.quantity}`);
    
    messageApi.success(`订单提交成功，即将为您结算以下商品：${selectedProducts.join(', ')}`);
    // 这里可以跳转到支付页面或其他处理
  };

  // 返回首页
  const handleGoBack = () => {
    navigate('/');
  };

  // 获取商品的可用尺码
  const getAvailableSizes = async (productId: string) => {
    try {
      const products = await request.get('/products');
      const product = products.find((p: any) => p._id === productId);
      return product && product.size ? product.size : [];
    } catch (error) {
      console.error('获取商品尺码失败:', error);
      return [];
    }
  };

  return (
    <div className="flex justify-center bg-gray-50 min-h-screen pb-32 w-full">
      {contextHolder}
      <div className="w-full max-w-7xl mt-8 px-2 sm:px-4">
        {/* 返回按钮和标题 */}
        <div className="flex items-center mb-8 w-full">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleGoBack}
            className="mr-4"
            size="large"
            type="text"
          >
            返回首页
          </Button>
          <h1 className="text-3xl font-bold flex items-center flex-grow">
            <ShoppingOutlined className="mr-2" />
            我的购物车
          </h1>
          {cart.items.length > 0 && (
            <Popconfirm
              title="清空购物车"
              description="确定要清空购物车吗？此操作将清空所有商品"
              onConfirm={clearCart}
              okText="确定"
              cancelText="取消"
              okType="danger"
            >
              <Button danger size="large" className='mr-4'>清空购物车</Button>
            </Popconfirm>
          )}
        </div>

        {loading ? (
          <Card className="w-full shadow-md rounded-lg">
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        ) : cart.items.length === 0 ? (
          <Card className="w-full shadow-lg rounded-2xl p-4 sm:p-8 bg-white" style={{ minWidth: '0', maxWidth: '600px', margin: '0 auto' }}>
            <div className="flex flex-col items-center justify-center py-16">
              <Empty
                description="购物车还是空的，去添加一些商品吧"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="my-8"
                imageStyle={{ height: 120 }}
              />
              <Button 
                color="orange"
                variant='solid'
                type="primary" 
                size="large"
                className="mt-8 px-12 text-lg"
                onClick={() => navigate('/')}
              >
                去购物
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card className="w-full shadow-lg rounded-2xl mb-8 p-2 sm:p-8 bg-white">
              {/* 全选区域 */}
              <div className="flex items-center mb-6 pb-4 border-b">
                <Checkbox 
                  checked={selectedItems.length === cart.items.length}
                  indeterminate={selectedItems.length > 0 && selectedItems.length < cart.items.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="text-lg"
                >
                  全选
                </Checkbox>
                <div className="ml-auto text-gray-500">
                  已选择 {selectedItems.length} 种商品
                </div>
              </div>
              
              <List
                className="w-full"
                itemLayout="horizontal"
                dataSource={cart.items}
                renderItem={(item: any) => (
                  <List.Item className="py-4 sm:py-6 border-b last:border-b-0">
                    <div className="flex flex-col sm:flex-row w-full items-center">
                      {/* 选择框 */}
                      <Checkbox
                        checked={selectedItems.includes(item._id)}
                        onChange={(e) => handleItemSelect(item._id, e.target.checked)}
                        className="mr-4 md:mr-6"
                      />
                      
                      {/* 商品图片 */}
                      <div 
                        className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center mr-8 cursor-pointer overflow-hidden"
                        onClick={() => navigate(`/item/${item.productId}`)}
                      >
                        <img 
                          src={item.picURL} 
                          alt={item.name} 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-bold text-2xl mb-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/item/${item.productId}`)}
                        >
                          {item.name}
                        </div>
                        <div className="text-primary font-bold text-xl mb-2">¥{item.price.toFixed(2)}</div>
                        
                        {/* 显示尺码信息 */}
                        {item.size && (
                          <div className="text-gray-500 mb-2">
                            尺码: <Tag color="blue" >{item.size}</Tag>
                          </div>
                        )}
                        
                        <div className="text-gray-500 mb-2">商品编号：{item.productId}</div>
                      </div>
                      {/* 操作区 */}
                      <div className="flex flex-col items-end min-w-[220px]">
                        <div className="flex items-center mb-4">
                          <span className="mr-2 text-gray-600 text-lg">数量:</span>
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(value) => {
                              if (value) updateQuantity(item._id, value as number);
                            }}
                            className="w-24 text-lg"
                            size="large"
                            controls
                          />
                        </div>
                        
                        {/* 添加尺码修改功能 - 优化样式 */}
                        {item.size && productSizes[item.productId] && (
                          <div className="mb-4">
                            <Popover
                              content={
                                <div className="p-3">
                                  <div className="mb-2 font-medium">选择尺码</div>
                                  <Radio.Group 
                                    value={item.size}
                                    onChange={(e) => updateSize(item._id, e.target.value)}
                                    className="flex flex-wrap gap-2"
                                  >
                                    {productSizes[item.productId].map(size => (
                                      <Radio.Button 
                                        key={size} 
                                        value={size} 
                                        className={`m-1 ${item.size === size ? 'bg-primary text-white' : ''}`}
                                      >
                                        {size}
                                      </Radio.Button>
                                    ))}
                                  </Radio.Group>
                                </div>
                              }
                              title="修改尺码"
                              trigger="click"
                              placement="left"
                            >
                              <Button 
                                size="middle" 
                                className="mb-2 flex items-center"
                                type="default"
                              >
                                修改尺码
                              </Button>
                            </Popover>
                          </div>
                        )}
                        
                        <div className="text-2xl font-bold mb-4 text-primary">
                          ¥{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <Popconfirm
                          title="删除商品"
                          description="确定要从购物车中删除此商品吗？"
                          onConfirm={() => removeItem(item._id)}
                          okText="确定"
                          cancelText="取消"
                          okType="danger"
                        >
                          <Button 
                            danger 
                            icon={<DeleteOutlined />}
                            size="large"
                            className="flex items-center"
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
            
            <Card className="w-full shadow-lg rounded-2xl p-8 bg-white sticky bottom-0">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0 text-lg">
                  已选择 <span className="font-bold">{selectedItems.length}</span> 种商品，
                  合计 <span className="font-bold">{calculateSelectedCount()}</span> 件
                </div>
                <div className="flex items-center">
                  <Statistic 
                    title={<span className="text-xl font-bold">总计</span>} 
                    value={calculateSelectedTotal()} 
                    precision={2} 
                    prefix="¥" 
                    className="mr-8"
                    valueStyle={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '32px' }}
                  />
                  <Button 
                  color="danger"
                  variant="solid"
                    type="primary" 
                    size="large" 
                    onClick={checkout}
                    className="px-12 text-xl"
                    disabled={selectedItems.length === 0}
                  >
                    结算
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopCar;