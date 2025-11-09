'use client';

import React, { useEffect, useState } from 'react';
import { Cart, CartItem } from '@/packages/types/src/cart';
import { CheckoutRequest, PaymentInfo, ShippingInfo } from '@/packages/types/src/payments';

const userId = 'user-123'; // 佔位符使用者 ID

const CartPage = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    address: '123 Main St',
    city: 'Anytown',
    zipCode: '12345',
    country: 'USA',
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'mock',
  });

  const fetchCart = async () => {
    setLoading(true);
    const res = await fetch(`/api/cart-payments?userId=${userId}`);
    const data = await res.json();
    setCart(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleAddItem = async (item: CartItem) => {
    await fetch('/api/cart-payments/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, userId }),
    });
    fetchCart();
  };

  const handleRemoveItem = async (itemId: string) => {
    await fetch(`/api/cart-payments/items?userId=${userId}&id=${itemId}`, {
      method: 'DELETE',
    });
    fetchCart();
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      alert('您的購物車是空的！');
      return;
    }

    const checkoutRequest: CheckoutRequest = {
      userId,
      cart,
      shippingInfo,
      paymentInfo,
    };

    const res = await fetch('/api/cart-payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutRequest),
    });
    const data = await res.json();
    alert(`結帳狀態: ${data.status}, 訂單 ID: ${data.orderId}`);
    fetchCart(); // 重新整理購物車 (應該會是空的)
  };

  if (loading) {
    return <div>載入購物車中...</div>;
  }

  return (
    <div>
      <h1>您的購物車</h1>
      {!cart || cart.items.length === 0 ? (
        <p>您的購物車是空的。</p>
      ) : (
        <div>
          {cart.items.map((item) => (
            <div key={item.itemId} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
              <h3>{item.name}</h3>
              <p>價格: ${item.price.toFixed(2)}</p>
              <p>數量: {item.quantity}</p>
              <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: '100px' }} />
              <button onClick={() => handleRemoveItem(item.itemId)}>移除</button>
            </div>
          ))}
          <h2>總計: ${cart.total.toFixed(2)}</h2>
          
          <h3>運送資訊</h3>
          <p>地址: {shippingInfo.address}</p>
          <p>城市: {shippingInfo.city}</p>
          <p>郵遞區號: {shippingInfo.zipCode}</p>
          <p>國家: {shippingInfo.country}</p>

          <h3>支付資訊</h3>
          <p>支付方式: {paymentInfo.method}</p>

          <button onClick={handleCheckout}>前往結帳</button>
        </div>
      )}

      <h2>測試用：新增商品</h2>
      <button onClick={() => handleAddItem({
        itemId: 'prod-1',
        name: '測試商品 A',
        price: 19.99,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100/FF0000/FFFFFF?text=ItemA'
      })}>新增商品 A</button>
      <button onClick={() => handleAddItem({
        itemId: 'prod-2',
        name: '測試商品 B',
        price: 29.99,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100/00FF00/FFFFFF?text=ItemB'
      })}>新增商品 B</button>
    </div>
  );
};

export default CartPage;
