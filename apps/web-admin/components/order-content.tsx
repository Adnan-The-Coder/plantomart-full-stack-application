"use client";
import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

// Types
type Vendor = {
  vendor_id: string;
  id: string;
  name: string;
};

type Order = {
  id: string;
  order_id: string;
  user_uuid: string;
  vendor_id: string;
  total_amount: number;
  payment_method?: string;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
};

const OrdersContent = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [ordersByVendor, setOrdersByVendor] = useState<
    Record<string, Order[]>
  >({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch vendors
  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.getAllVendorsAdmin);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data: any = await res.json();
      const vendorsList: Vendor[] = data.data || [];
      setVendors(vendorsList);

      // Fetch orders for each vendor
      vendorsList.forEach((vendor) => {
        fetchOrdersForVendor(vendor.vendor_id);
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders for a vendor
  const fetchOrdersForVendor = async (vendorId: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.getOrdersByVendor(vendorId));
      if (!res.ok)
        throw new Error(`Failed to fetch orders for vendor ${vendorId}`);
      const data: any = await res.json();
      const ordersArray = data.data || [];
      console.log("Orders Array: ", ordersArray);
      setOrdersByVendor((prev) => ({
        ...prev,
        [vendorId]: ordersArray,
      }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const res = await fetch(API_ENDPOINTS.getOrderItems(order.id));
      if (!res.ok) throw new Error("Failed to fetch order items");
      const data: any = await res.json();
      setOrderItems(data.data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    const chosen = config[status] || config["pending"];
    const Icon = chosen.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${chosen.color}`}
      >
        <Icon className="h-3 w-3" /> {status}
      </span>
    );
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Orders by Vendors
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : vendors.length === 0 ? (
        <p className="text-gray-500 text-center">No vendors found.</p>
      ) : (
        vendors.map((vendor) => (
          <div key={vendor.vendor_id} className="space-y-4">
            {/* Vendor Section */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {vendor.name} ({vendor.vendor_id})
            </h3>

            {/* Orders Table */}
            {ordersByVendor[vendor.vendor_id] &&
            ordersByVendor[vendor.vendor_id].length > 0 ? (
              <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3">Order #</th>
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Payment</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersByVendor[vendor.vendor_id].map((order) => (
                      <tr
                        key={order.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 font-mono">
                          {order.order_id}
                        </td>
                        <td className="px-6 py-4">{order.user_uuid}</td>
                        <td className="px-6 py-4 font-medium">
                          ${order.total_amount}
                        </td>
                        <td className="px-6 py-4">
                          {order.payment_method || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => fetchOrderDetails(order)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No orders for this vendor.</p>
            )}
          </div>
        ))
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-bold">Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Order #</span>
                <span>{selectedOrder.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span>${selectedOrder.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment</span>
                <span>{selectedOrder.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date</span>
                <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Items
                </h4>
                {orderItems.length > 0 ? (
                  <ul className="space-y-2">
                    {orderItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between border-b pb-2"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>${item.price}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No items found</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersContent;
