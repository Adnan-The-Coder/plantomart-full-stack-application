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
  User,
  Calendar,
  CreditCard,
  MapPin,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { API_ENDPOINTS } from "@/config/api";

// Enhanced Types based on schema
type UserProfile = {
  uuid: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type Vendor = {
  vendor_id: string;
  id: string;
  name: string;
  user_uuid: string;
  slug?: string;
  contact_email?: string;
};

type Order = {
  id: string;
  order_id: string;
  user_uuid: string;
  vendor_id: string;
  total_amount: number;
  currency: string;
  payment_method?: string;
  payment_status?: string;
  status: string;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_title?: string;
  name?: string; // fallback field
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

type OrderWithUser = Order & {
  user?: UserProfile;
};

const OrdersContent = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [ordersByVendor, setOrdersByVendor] = useState<
    Record<string, OrderWithUser[]>
  >({});
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all user profiles for lookup
  const fetchUserProfiles = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.getAllProfiles);
      if (!res.ok) throw new Error("Failed to fetch user profiles");
      const data:any = await res.json();
      const profiles: UserProfile[] = data.data || [];
      
      // Create lookup object
      const profilesMap: Record<string, UserProfile> = {};
      profiles.forEach(profile => {
        profilesMap[profile.uuid] = profile;
      });
      
      setUserProfiles(profilesMap);
    } catch (err: any) {
      console.error("Error fetching user profiles:", err);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.getAllVendorsAdmin);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data:any = await res.json();
      const vendorsList: Vendor[] = data.data || [];
      setVendors(vendorsList);

      // Fetch orders for each vendor
      const orderPromises = vendorsList.map(vendor => 
        fetchOrdersForVendor(vendor.vendor_id)
      );
      
      await Promise.all(orderPromises);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders for a vendor
  const fetchOrdersForVendor = async (vendorId: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.getOrdersByVendor(vendorId, 1, 100));
      if (!res.ok) {
        throw new Error(`Failed to fetch orders for vendor ${vendorId}`);
      }
      const data:any = await res.json();
      const ordersArray: Order[] = data.data || [];
      
      // Enhance orders with user data
      const ordersWithUsers: OrderWithUser[] = ordersArray.map(order => ({
        ...order,
        user: userProfiles[order.user_uuid]
      }));

      setOrdersByVendor((prev) => ({
        ...prev,
        [vendorId]: ordersWithUsers,
      }));
    } catch (err: any) {
      console.error(`Error fetching orders for vendor ${vendorId}:`, err);
    }
  };

  // Fetch order details
  const fetchOrderDetails = async (order: OrderWithUser) => {
    setSelectedOrder(order);
    setDetailsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.getOrderItems(order.order_id));
      if (!res.ok) throw new Error("Failed to fetch order items");
      const data:any = await res.json();
      setOrderItems(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    await fetchUserProfiles();
    await fetchVendors();
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchUserProfiles();
      await fetchVendors();
    };
    loadData();
  }, []);

  // Update orders when user profiles change
  useEffect(() => {
    if (Object.keys(userProfiles).length > 0) {
      setOrdersByVendor(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(vendorId => {
          updated[vendorId] = updated[vendorId].map(order => ({
            ...order,
            user: userProfiles[order.user_uuid]
          }));
        });
        return updated;
      });
    }
  }, [userProfiles]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      completed: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
      delivered: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
      shipped: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
      processing: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Clock },
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      refunded: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: RefreshCw },
    };
    const chosen = config[status.toLowerCase()] || config["pending"];
    const Icon = chosen.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${chosen.color}`}
      >
        <Icon className="h-3 w-3" /> 
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const config: Record<string, { color: string }> = {
      paid: { color: "bg-green-100 text-green-700 border-green-200" },
      pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      failed: { color: "bg-red-100 text-red-700 border-red-200" },
    };
    const chosen = config[status.toLowerCase()] || config["pending"];
    
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${chosen.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getUserDisplay = (order: OrderWithUser) => {
    const user = order.user;
    if (!user) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-mono">{order.user_uuid}</div>
            <div className="text-xs text-gray-400">User not found</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-gray-500" />
          )}
        </div>
        <div>
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {user.full_name}
          </div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>
    );
  };

  const getTotalOrdersCount = () => {
    return Object.values(ordersByVendor).reduce((total, orders) => total + orders.length, 0);
  };

  const getTotalRevenue = () => {
    return Object.values(ordersByVendor).flat().reduce((total, order) => total + order.total_amount, 0);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all vendor orders from your admin panel
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTotalOrdersCount()}
                </div>
                <div className="text-sm text-gray-500">Total Orders</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(getTotalRevenue())}
                </div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {vendors.length}
                </div>
                <div className="text-sm text-gray-500">Active Vendors</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading orders data...</p>
          </div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No vendors found</p>
        </div>
      ) : (
        /* Vendor Sections */
        <div className="space-y-8">
          {vendors.map((vendor) => (
            <div key={vendor.vendor_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Vendor Header */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vendor.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono">ID: {vendor.vendor_id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {ordersByVendor[vendor.vendor_id]?.length || 0} orders
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(
                        ordersByVendor[vendor.vendor_id]?.reduce((sum, order) => sum + order.total_amount, 0) || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              {ordersByVendor[vendor.vendor_id] && ordersByVendor[vendor.vendor_id].length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {ordersByVendor[vendor.vendor_id].map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getUserDisplay(order)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                              {order.order_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(order.total_amount, order.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {order.payment_method || "N/A"}
                              </div>
                              {order.payment_status && getPaymentStatusBadge(order.payment_status)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleDateString('en-IN')}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(order.created_at).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => fetchOrderDetails(order)}
                              className="inline-flex items-center gap-1 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No orders found for this vendor</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h3>
                <p className="text-sm text-gray-500 mt-1">#{selectedOrder.order_id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Customer & Order Info */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer Information
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    {getUserDisplay(selectedOrder)}
                    {selectedOrder.user && (
                      <div className="mt-3 space-y-1 text-sm">
                        {selectedOrder.user.phone && (
                          <div className="text-gray-600 dark:text-gray-400">
                            📱 {selectedOrder.user.phone}
                          </div>
                        )}
                        {selectedOrder.user.address && (
                          <div className="text-gray-600 dark:text-gray-400">
                            📍 {selectedOrder.user.address}, {selectedOrder.user.city}, {selectedOrder.user.state} {selectedOrder.user.pincode}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Order Summary
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                      <span className="font-semibold text-lg text-gray-900 dark:text-white">
                        {formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                      <span className="text-gray-900 dark:text-white">
                        {selectedOrder.payment_method || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                      <span>{getPaymentStatusBadge(selectedOrder.payment_status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Status:</span>
                      <span>{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              {(selectedOrder.shipping_address || selectedOrder.billing_address) && (
                <div className="px-6 pb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4" /> Addresses
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedOrder.shipping_address && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Shipping Address</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.shipping_address}</p>
                      </div>
                    )}
                    {selectedOrder.billing_address && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Billing Address</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.billing_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="px-6 pb-6">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4" /> Order Items
                  {detailsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </h4>
                
                {detailsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : orderItems.length > 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-600/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                              Product
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {orderItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {item.product_title || item.name || 'Unknown Product'}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  ID: {item.product_id}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(item.total_price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-600/50">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                              Total Amount:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-lg text-gray-900 dark:text-white">
                              {formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No items found for this order</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="px-6 pb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Order Notes</h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-600 px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
              {/* You can add more action buttons here like "Update Status", "Print Invoice", etc. */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersContent;