import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { orders, orderItems, products, userProfiles, vendorProfiles } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

// Create an order with items
export const createOrder = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();
    const {
      user_uuid,
      vendor_id,
      items,
      total_amount,
      currency = 'INR',
      payment_id,
      payment_method,
      payment_status = 'paid',
      shipping_address,
      billing_address,
      notes
    } = body;

    if (!user_uuid || !vendor_id || !Array.isArray(items) || items.length === 0 || !total_amount) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    // Validate user and vendor exist
    const [user] = await db.select().from(userProfiles).where(eq(userProfiles.uuid, user_uuid)).limit(1);
    if (!user) return c.json({ success: false, message: 'User not found' }, 404);

    const [vendor] = await db.select().from(vendorProfiles).where(eq(vendorProfiles.vendor_id, vendor_id)).limit(1);
    if (!vendor) return c.json({ success: false, message: 'Vendor not found' }, 404);

    // Validate products
    const productIds = items.map((it: any) => it.product_id);
    const productsFound = await db.select().from(products).where(inArray(products.product_id, productIds));
    if (productsFound.length !== productIds.length) {
      return c.json({ success: false, message: 'One or more products not found' }, 400);
    }

    const orderId = uuidv4();

    // Insert order
    const [created] = await db
      .insert(orders)
      .values({
        order_id: orderId,
        user_uuid: user_uuid.trim(),
        vendor_id: vendor_id.trim(),
        total_amount: Number(total_amount),
        currency,
        status: payment_status === 'paid' ? 'paid' : 'pending',
        payment_id: payment_id || null,
        payment_method: payment_method || null,
        payment_status,
        shipping_address: shipping_address || null,
        billing_address: billing_address || null,
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning();

    // Insert items
    for (const it of items) {
      const quantity = Number(it.quantity);
      const unit_price = Number(it.unit_price);
      await db.insert(orderItems).values({
        order_id: orderId,
        product_id: it.product_id,
        product_title: it.product_title || null,
        quantity,
        unit_price,
        total_price: unit_price * quantity,
        created_at: new Date().toISOString()
      });
    }

    return c.json({ success: true, message: 'Order created', data: created });
  } catch (error) {
    console.error('Create order error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
};

// Get orders for a vendor
export const getOrdersByVendor = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { vendorId } = c.req.param();
    const { page = '1', limit = '20' } = c.req.query();
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = Math.min(parseInt(limit as string, 10), 100);
    const offset = (pageNumber - 1) * limitNumber;

    if (!vendorId) return c.json({ success: false, message: 'Vendor ID is required' }, 400);

    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.vendor_id, vendorId))
      .orderBy(desc(orders.created_at))
      .limit(limitNumber)
      .offset(offset);

    return c.json({ success: true, data: results, pagination: { page: pageNumber, limit: limitNumber, count: results.length } });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
};

// Get orders for a user
export const getOrdersByUser = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { userUUID } = c.req.param();
    const { page = '1', limit = '20' } = c.req.query();
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = Math.min(parseInt(limit as string, 10), 100);
    const offset = (pageNumber - 1) * limitNumber;

    if (!userUUID) return c.json({ success: false, message: 'User UUID is required' }, 400);

    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.user_uuid, userUUID))
      .orderBy(desc(orders.created_at))
      .limit(limitNumber)
      .offset(offset);

    return c.json({ success: true, data: results, pagination: { page: pageNumber, limit: limitNumber, count: results.length } });
  } catch (error) {
    console.error('Get user orders error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
};

// Get order items by order_id
export const getOrderItems = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { orderId } = c.req.param();
    if (!orderId) return c.json({ success: false, message: 'Order ID is required' }, 400);
    const items = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
    return c.json({ success: true, data: items });
  } catch (error) {
    console.error('Get order items error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
};

// Update order status
export const updateOrderStatus = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { orderId } = c.req.param();
    const { status } = await c.req.json();
    if (!orderId || !status) return c.json({ success: false, message: 'Order ID and status are required' }, 400);
    const result = await db
      .update(orders)
      .set({ status, updated_at: new Date().toISOString() })
      .where(eq(orders.order_id, orderId))
      .returning();
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
};

// Get single order with items
export const getOrder = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const { orderId } = c.req.param();
    if (!orderId) return c.json({ success: false, message: 'Order ID is required' }, 400);
    const [ord] = await db.select().from(orders).where(eq(orders.order_id, orderId)).limit(1);
    if (!ord) return c.json({ success: false, message: 'Order not found' }, 404);
    const items = await db.select().from(orderItems).where(eq(orderItems.order_id, orderId));
    return c.json({ success: true, data: { ...ord, items } });
  } catch (error) {
    console.error('Get order error:', error);
    return c.json({ success: false, message: 'Internal server error' }, 500);
  }
};
