import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const PaySuccess = () => {
  const navigate = useNavigate();
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Result
        status="success"
        title="支付成功！"
        subTitle="您的订单已支付成功，感谢您的购买。"
        extra={[
          <Button type="primary" key="home" onClick={() => navigate('/')}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  );
};

export default PaySuccess;