import request from '../utils/request';

export const createPayment = async (orderId, paymentMethod) => {
  const response = await request.post('/payment/create', {
    orderId,
    paymentMethod
  });
  return response;
};

export const getPaymentStatus = async (orderId) => {
  const response = await request.get(`/payment/status/${orderId}`);
  return response;
};

export const testPayment = async (orderId, paymentMethod) => {
  const response = await request.post('/payment/test', {
    orderId,
    paymentMethod
  });
  return response;
};