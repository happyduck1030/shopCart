import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 连接 MongoDB（使用 admin 数据库）
mongoose.connect('mongodb://localhost:27017/admin')
  .then(() => {
    console.log('✅ 已连接到数据库:', mongoose.connection.name);
    // 确保连接成功后初始化模型
    initModel();
  })
  .catch(err => console.error('❌ 连接失败:', err));

// 初始化商品模型
let Product;
let Cart;
const initModel = () => {
  const productSchema = new mongoose.Schema({
    name: String,
    type: String,
    price: Number,
    stock: Number,
    picURL: String,
    size: [String] // 添加尺码字段，使用数组类型存储多个尺码选项
  }, { 
    strict: false,   // 允许未定义字段
    collection: 'products'
  });

  // 购物车模型
  const cartSchema = new mongoose.Schema({
    userId: { type: String, default: 'default_user' }, // 简化版，使用默认用户
    items: [{
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      picURL: String,
      size: String // 添加尺码字段
    }],
    createdAt: { type: Date, default: Date.now }
  }, {
    collection: 'carts'
  });

  Product = mongoose.model('Product', productSchema);
  Cart = mongoose.model('Cart', cartSchema);
  console.log('🎯 当前集合:', Product.collection.name);
};

// 连接成功后打印真实数据
mongoose.connection.on('connected', async () => {
  try {
    const count = await mongoose.connection.db.collection('products').countDocuments();
    const rawDocs = await mongoose.connection.db.collection('products').find({}).toArray();
  } catch (err) {
    console.error('❌ 数据查询失败:', err);
  }
});

// 获取商品接口（兼容手动插入数据）
app.get('/api/products', async (req, res) => {
  try {
    // 使用原生驱动查询（绕过 Mongoose Schema 过滤）
    const rawProducts = await mongoose.connection.db.collection('products').find({}).toArray();
    
    // 添加调试信息，查看原始数据的完整结构
    console.log('原始数据完整结构示例:');
    console.log(JSON.stringify(rawProducts[0], null, 2));
    
    // 数据清洗（修复手动插入的非法字段）
    const cleanedProducts = rawProducts.map(doc => {
      // 检查 size 字段的存在和类型
      let sizeArray = [];
      
      console.log(`处理商品 ${doc.name || doc.名称} 的尺码信息:`);
      
      // 直接检查原始数据中是否有 size 字段
      if (doc.size !== undefined) {
        console.log('原始 size 字段类型:', typeof doc.size);
        console.log('原始 size 字段值:', JSON.stringify(doc.size));
        
        // 如果 size 已经是数组，直接使用
        if (Array.isArray(doc.size)) {
          console.log('size 是数组类型');
          sizeArray = doc.size;
        } 
        // 如果 size 是对象（如 MongoDB 中显示的那样），转换为数组
        else if (typeof doc.size === 'object') {
          console.log('size 是对象类型，转换为数组');
          // 尝试从对象中提取值
          try {
            // 检查是否有数字键（如 "0", "1", "2"...）
            const numericKeys = Object.keys(doc.size).filter(k => !isNaN(Number(k)));
            if (numericKeys.length > 0) {
              // 如果有数字键，按顺序提取值
              sizeArray = numericKeys.sort((a, b) => Number(a) - Number(b))
                .map(k => doc.size[k]);
            } else {
              // 否则直接获取所有值
              sizeArray = Object.values(doc.size);
            }
            console.log('转换后的尺码数组:', sizeArray);
          } catch (e) {
            console.error('转换尺码对象失败:', e);
            sizeArray = [];
          }
        }
        // 如果是字符串，尝试解析为数组
        else if (typeof doc.size === 'string') {
          console.log('size 是字符串类型，尝试解析');
          try {
            const parsed = JSON.parse(doc.size);
            sizeArray = Array.isArray(parsed) ? parsed : [doc.size];
          } catch (e) {
            console.log('解析失败，使用原始字符串');
            sizeArray = [doc.size];
          }
        }
      } else {
        console.log('商品没有 size 字段，尝试查找其他可能的字段名');
        
       
      }
      
      // 确保返回的对象包含 size 字段
      const cleanedProduct = {
        name: doc.name || doc.名称,  // 兼容中文字段名
        type: doc.type || doc.类型,
        price: parseFloat(doc.price || doc.价格),
        stock: parseInt(doc.stock || doc.库存, 10),
        picURL: doc.picURL || doc.图片链接,
        size: sizeArray, // 使用处理后的尺码数组
        _id: doc._id.toString()  // 统一 _id 格式
      };
      
      return cleanedProduct;
    });

  
  
    res.json(cleanedProducts);
  } catch (err) {
    console.error('❌ 接口查询失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 添加商品到购物车
app.post('/api/cart', async (req, res) => {
  try {
    const { productId, quantity, size } = req.body;
    console.log('收到添加购物车请求:', { productId, quantity, size });
    
    const userId = 'default_user'; // 简化版，使用默认用户
    
    // 查找商品信息 - 使用原生查询确保获取完整数据
    const product = await mongoose.connection.db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(productId) });
   
    if (!product) {
      console.log('商品不存在:', productId);
      return res.status(404).json({ error: '商品不存在' });
    }
    
    console.log('找到商品:', {
      id: product._id,
      name: product.name,
      size: product.size
    });
    
    // 查找用户购物车
    let cart = await Cart.findOne({ userId });
    
    // 如果购物车不存在，创建新购物车
    if (!cart) {
      console.log('创建新购物车');
      cart = new Cart({ userId, items: [] });
    }
    
    // 确保 size 有值
    const finalSize = size || (Array.isArray(product.size) && product.size.length > 0 ? product.size[0] : '标准');
    console.log('使用的尺码:', finalSize);
    
    // 检查购物车中是否已有该商品（同一商品不同尺码视为不同商品）
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId && item.size === finalSize
    );
    
    if (existingItemIndex > -1) {
      // 更新已有商品数量
      console.log('更新已有商品数量');
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // 添加新商品到购物车
      console.log('添加新商品到购物车');
      cart.items.push({
        productId,
        name: product.name || product.名称,
        price: parseFloat(product.price || product.价格),
        quantity,
        picURL: product.picURL || product.图片链接,
        size: finalSize // 确保添加尺码信息
      });
    }
    
    // 保存购物车
    await cart.save();
    console.log('保存购物车后，商品数量:', cart.items.length);
    
    res.status(201).json(cart);
  } catch (err) {
    console.error('❌ 添加购物车失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新购物车商品数量
app.put('/api/cart/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, size } = req.body; // 添加size参数，支持修改尺码
    console.log('更新购物车商品，itemId:', itemId, '数量:', quantity, '尺码:', size); // 添加日志
    
    const userId = 'default_user';
    
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ error: '购物车不存在' });
    }
    
    // 查找要更新的商品
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: '商品不存在' });
    }
    
    // 更新数量
    if (quantity) {
      cart.items[itemIndex].quantity = quantity;
    }
    
    // 更新尺码（如果提供了）
    if (size) {
      cart.items[itemIndex].size = size;
    }
    
    await cart.save();
    
    res.json(cart);
  } catch (err) {
    console.error('❌ 更新购物车商品失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 从购物车删除商品
app.delete('/api/cart/:itemId', async (req, res) => {
  // 先检查是否是清空购物车的请求
  if (req.params.itemId === 'clear') {
    try {
      const userId = 'default_user';
      console.log('收到清空购物车请求');
      
      // 查找用户的购物车
      const cart = await Cart.findOne({ userId });
      
      if (cart) {
        // 清空购物车中的商品
        cart.items = [];
        await cart.save();
        console.log('购物车已清空');
        return res.json({ message: '购物车已清空' });
      } else {
        console.log('购物车不存在');
        return res.status(404).json({ error: '购物车不存在' });
      }
    } catch (err) {
      console.error('❌ 清空购物车失败:', err);
      return res.status(500).json({ error: '服务器内部错误' });
    }
  }
  
  // 如果不是清空购物车，则按原来的逻辑处理删除单个商品
  try {
    const { itemId } = req.params;
    console.log('删除购物车商品，itemId:', itemId); // 添加日志
    
    const userId = 'default_user';
    
    const cart = await Cart.findOne({ userId });
    console.log('查找到的购物车:', cart ? cart._id : '未找到'); // 添加日志
    
    if (!cart) {
      return res.status(404).json({ error: '购物车不存在' });
    }
    
    // 记录删除前的商品数量
    const beforeCount = cart.items.length;
    console.log('删除前商品数量:', beforeCount); // 添加日志
    
    // 过滤掉要删除的商品
    cart.items = cart.items.filter(item => {
      console.log('比较:', item._id.toString(), itemId); // 添加日志，查看ID比较
      return item._id.toString() !== itemId;
    });
    
    console.log('删除后商品数量:', cart.items.length); // 添加日志
    
    // 检查是否有商品被删除
    if (cart.items.length === beforeCount) {
      console.log('警告：没有商品被删除，可能ID不匹配'); // 添加日志
    }
    
    await cart.save();
    console.log('购物车已保存'); // 添加日志
    
    res.json(cart);
  } catch (err) {
    console.error('❌ 删除购物车商品失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取购物车内容 - 确保路径是 '/api/cart'
app.get('/api/cart', async (req, res) => {
  try {
    // 简化版，使用默认用户
    const userId = 'default_user';
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = { userId, items: [] };
    }
    
    res.json(cart);
  } catch (err) {
    console.error('❌ 获取购物车失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 清空购物车
app.delete('/api/cart/clear', async (req, res) => {
  try {
    const userId = 'default_user';
    console.log('收到清空购物车请求');
    
    // 查找用户的购物车
    const cart = await Cart.findOne({ userId });
    
    if (cart) {
      // 清空购物车中的商品
      cart.items = [];
      await cart.save();
      console.log('购物车已清空');
      res.json({ message: '购物车已清空' });
    } else {
      console.log('购物车不存在');
      res.status(404).json({ error: '购物车不存在' });
    }
  } catch (err) {
    console.error('❌ 清空购物车失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Server running on http://localhost:5000');
});