import { Hono } from 'hono';
import { createOrder, getOrdersByVendor, getOrdersByUser, getOrderItems, updateOrderStatus, getOrder } from '../controllers/order';

const orderRoutes = new Hono();

orderRoutes.post('/create', createOrder);
orderRoutes.get('/vendor/:vendorId', getOrdersByVendor);
orderRoutes.get('/user/:userUUID', getOrdersByUser);
orderRoutes.get('/items/:orderId', getOrderItems);
orderRoutes.patch('/status/:orderId', updateOrderStatus);
orderRoutes.get('/:orderId', getOrder);

export default orderRoutes;
