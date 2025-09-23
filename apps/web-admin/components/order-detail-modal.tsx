import { X, User, Mail, Phone, MapPin, DollarSign, CheckCircle } from "lucide-react";
import { getStatusBadge } from "./StatusBadge";

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'paid';

type OrderItem = {
  id?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  price?: number;
  total_price?: number;
  variant_details?: any;
};

type Order = {
  id?: string;
  order_id?: string;
  vendor_id?: string;
  user_uuid?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  billing_address?: string;
  total_amount?: number;
  currency?: string;
  status?: OrderStatus;
  payment_status?: string;
  payment_method?: string;
  payment_id?: string;
  tracking_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  estimated_delivery?: string;
  items?: OrderItem[];
  item_count?: number;
};

export const OrderDetailModal = ({ order, isOpen, onClose }: { order: Order | null, isOpen: boolean, onClose: () => void }) => {
    if (!isOpen || !order) return null;

    const formatCurrency = (amount: number, currency: string = 'INR') => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Order Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Order #{order.order_id || order.id}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Order ID: {order.id}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(order.status || 'pending')}
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(order.total_amount || 0, order.currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Customer Information
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customer UUID</p>
                      <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                        {order.user_uuid || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.customer_email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.customer_phone || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping & Payment */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Shipping & Payment
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Shipping Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.shipping_address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Billing Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.billing_address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.payment_method || 'Not specified'}
                      </p>
                      {order.payment_id && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          Payment ID: {order.payment_id}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.payment_status || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Order Items
                </h4>
                
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.product_name || `Product ${item.product_id}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantity: {item.quantity || 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.total_price || item.price || 0, order.currency)}
                        </p>
                        {item.price && item.quantity && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(item.price, order.currency)} each
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Order Summary
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(order.total_amount || 0, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Currency:</span>
                    <span>{order.currency || 'INR'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">Notes</h4>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.updated_at ? new Date(order.updated_at).toLocaleString() : 'Not available'}
                </p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors">
              Update Status
            </button>
          </div>
        </div>
      </div>
    );
  };