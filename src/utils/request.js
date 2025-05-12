import axios from 'axios';

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:5000/api', // 后端 API 基础地址
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可在此处添加 token 等全局请求头
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 统一处理响应数据格式
    return response.data;
  },
  error => {
    // 统一错误处理
    console.error('请求错误:', error.response?.status, error.message);
    return Promise.reject({
      code: error.response?.status || 500,
      message: error.response?.data?.message || '服务器连接异常'
    });
  }
);

export default request;