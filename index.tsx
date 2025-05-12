//这是一个路由配置页面
import React from 'react';
import { createBrowserRouter } from "react-router-dom";
import App from '../App';
import ItemDetail from '../pages/ItemDetail/index';
// 确保路径大小写正确
import ShopCar from '../pages/shopCar/index';
import PaySuccess from '../pages/PaySuccess/index';
// import Login from '../pages/Login';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "item/:id",  // 使用相对路径
        element: <ItemDetail />,
      },
      {
        path: "shopcar",   // 移除前导斜杠，使用相对路径
        element: <ShopCar />,
      },
      {
        path: "paysuccess",   // 新增支付成功页面路由
        element: <PaySuccess />,
      },
      // {
      //   path: "login",   // 移除前导斜杠，使用相对路径
      //   element: <Login />,
      // },
    ]
  }
]);

export { router };