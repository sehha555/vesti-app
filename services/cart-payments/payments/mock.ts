import { CheckoutRequest, CheckoutResponse } from '@/packages/types/src/payments';

export const processMockPayment = async (request: CheckoutRequest): Promise<CheckoutResponse> => {
  // 模擬支付處理邏輯
  console.log('Processing mock payment for:', request.cart.total);
  return {
    orderId: `mock-order-${Date.now()}`,
    status: 'completed',
    message: 'Mock payment successful',
  };
};
