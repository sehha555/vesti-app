import { Cart } from './cart';

export interface PaymentInfo {
  method: 'credit_card' | 'paypal' | 'mock';
  // 其他支付相關資訊，例如卡號、有效期限等 (此處為佔位符)
}

export interface ShippingInfo {
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface CheckoutRequest {
  userId: string;
  cart: Cart;
  paymentInfo: PaymentInfo;
  shippingInfo: ShippingInfo;
}

export interface CheckoutResponse {
  orderId: string;
  status: 'pending' | 'completed' | 'failed';
  message?: string;
}
