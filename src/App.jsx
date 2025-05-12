
import React from 'react';
import request from './utils/request';
import { useState, useEffect } from 'react';
import { Button, Layout, Menu, Input, Card, Badge, Avatar, Carousel, Divider } from 'antd';
import { ShoppingCartOutlined, UserOutlined, SearchOutlined, HeartOutlined, HomeOutlined } from '@ant-design/icons';
import { Outlet, Link, useLocation } from 'react-router-dom';
import carIcon from'../public/icon/shopCar.png'
import { set } from 'mongoose';
const { Header, Content, Footer } = Layout;
const { Meta } = Card;

// 轮播图数据
const carouselItems = [
  { id: 1, image: 'https://picsum.photos/1200/400?random=1', title: '夏季大促' },
  { id: 2, image: 'https://picsum.photos/1200/400?random=2', title: '新品上市' },
  { id: 3, image: 'https://picsum.photos/1200/400?random=3', title: '限时折扣' },
];
const filterPic=[
  {id:0,picurl:'../public/images/clothes.jpg'},
  {id:1,picurl:'../public/images/computer.jpg'},
  {id:2,picurl:'../public/images/huazhuang.jpg'},
  {id:3,picurl:'../public/images/home.jpg'},
]


// 在 App 组件中添加购物车数量状态和获取函数
export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartCount, setCartCount] = useState(0); 
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  // 获取购物车数量
  const fetchCartCount = async () => {
    try {
      const cart = await request.get('/cart');
      const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (err) {
      console.error('获取购物车数量失败:', err);
    }
  };
  
  // 获取商品数据
  const loadProducts = async () => {
    try {
      const data = await request.get('/products');
      setProducts(data);
      console.log('商品数据:', data);
    } catch (err) {
      console.error('获取商品失败:', err);
    }
  };

const filteredProducts=selectedCategory==='all'?products : products.filter(item=>item.type===selectedCategory)  //处理tab栏切换
  const handleTabChange = (category) => {
    console.log('切换到:', category);
    setSelectedCategory(category);
    } 
  

  useEffect(() => {
    loadProducts();
    fetchCartCount(); // 添加获取购物车数量
  }, []);



return (
    
    <Layout className="min-h-screen">
      {/* 顶部导航栏 */}
   
      <Header className="bg-white shadow-md px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex iteimage.pngms-center">
          <h1 className="text-primary text-2xl font-bold mr-8">品优购</h1>
          <Menu mode="horizontal" defaultSelectedKeys={['home']} className="border-0">
            <Menu.Item key="home">首页</Menu.Item>
            <Menu.Item key="new">新品</Menu.Item>
            <Menu.Item key="hot">热卖</Menu.Item>
            <Menu.Item key="promotion">促销</Menu.Item>
          </Menu>
        </div>
        <div className="flex items-center">
          <Input 
            placeholder="搜索商品" 
            prefix={<SearchOutlined />} 
            className="mr-4 w-64"
          />
          <Link to="/login">
            <Button icon={<UserOutlined />} className="mr-2">登录</Button>
          </Link>
          <Link to="/shopcar">
            <Badge count={cartCount}>
              <Button icon={<ShoppingCartOutlined />} className="flex items-center">
                购物车
                <img src={carIcon} alt="购物车" className="w-6 h-6 ml-2" />
              </Button>
            </Badge>
          </Link>
        </div>
      </Header>

      {/* 主要内容区 */}
      
      <Content className="p-6 max-w-7xl mx-auto">
        {isHomePage ? (
          // 首页内容
          <>
            {/* 轮播图 */}
            <div className="mb-8">
              <Carousel autoplay className="rounded-lg overflow-hidden">
                {carouselItems.map(item => (
                  <div key={item.id}>
                    <div className="h-96 relative">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                        <h3 className="text-2xl">{item.title}</h3>
                        <p>限时特惠，立即抢购！</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>

            {/* 分类导航 */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {['服装', '电子产品', '化妆品', '家电'].map((category, index) => (
                <div key={index} onClick={()=>handleTabChange(category)} className={`bg-gray-50 rounded-lg p-4 text-center text-primary ${selectedCategory===category? 'bg-primary text-white shadow-lg':''}  hover:bg-primary hover:text-white hover:shadow-lg  transition-all duration-300 cursor-pointer shadow-orange-200`}>
                  <div className=" text-white rounded-full w-full h-full flex items-center justify-center mx-auto mb-2">
                  <img src={filterPic[index].picurl} className='w-[90%] h-[90%] object-contain rounded-lg'  alt="" />
                  </div>
                  <div className="font-medium z-10 -mt-4 ">{category}</div>
                </div>
              ))}
            </div>

            {/* 商品列表 */}
            <Divider orientation="left">
              <span className="text-xl font-bold">热门商品</span>
            </Divider>
            
          
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {filteredProducts.map(product => (
            <Link to={`/item/${product._id}`} key={product._id}>
            <Card
            hoverable
            cover={<img alt={product.name} src={product.picURL} className="h-64 object-contain " />}
            actions={[
            <HeartOutlined key="favorite" />,
            <ShoppingCartOutlined key="add-to-cart" />,
            ]}
            className="transition-all hover:shadow-xl"
            >
            <Meta
            title={product.name}
            description={
            <div className="flex justify-between items-center mt-2">
            <span className="text-primary font-bold text-lg">¥{product.price}</span>
            <span className="text-gray-400 text-sm">已售 {Math.floor(Math.random() * 1000)}</span>
            </div>
            }
            />
            </Card>
            </Link>
            ))}
            </div>

            {/* 底部推荐 */}
            <Divider orientation="left">
              <span className="text-xl font-bold">为你推荐</span>
            </Divider>
            
        
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.slice(0, 4).map(product => (
            <div key={product._id} className="flex items-center space-x-3">
            <img src={product.picURL} alt={product.name} className="w-16 h-16 object-cover rounded" />
            <div>
            <div className="font-medium truncate w-32">{product.name}</div>
            <div className="text-primary">¥{product.price}</div>
            </div>
            </div>
            ))}
            </div>
            </div>
          </>
        ) : (
          // 非首页内容 - 修改这里，移除宽度限制，使其能撑满页面
          <div className="w-full bg-white rounded-lg shadow-md">
            <Outlet />
          </div>
        )}
      </Content>

      {/* 底部导航 */}
      <Footer className="bg-white p-0 fixed bottom-0 w-full shadow-inner">
        <div className="grid grid-cols-4 text-center py-2">
          <Link to="/" className="flex flex-col items-center text-primary">
            <HomeOutlined style={{ fontSize: '24px' }} />
            <span>首页</span>
          </Link>
          <Link to="/categories" className="flex flex-col items-center text-gray-500">
            <AppstoreOutlined style={{ fontSize: '24px' }} />
            <span>分类</span>
          </Link>
          <Link to="/shopcar" className="flex flex-col items-center text-gray-500">
            <Badge count={cartCount}>
              <ShoppingCartOutlined style={{ fontSize: '24px' }} />
            </Badge>
            <span>购物车</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center text-gray-500">
            <UserOutlined style={{ fontSize: '24px' }} />
            <span>我的</span>
          </Link>
        </div>
      </Footer>
    </Layout>
  );
}

// 需要导入的图标组件
function AppstoreOutlined() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
      <path d="M1 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4zM1 9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V9zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V9z"/>
    </svg>
  );
}
