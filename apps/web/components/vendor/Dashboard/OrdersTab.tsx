/* eslint-disable no-unused-vars */
"use client";
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Edit, Eye, Filter, MoreHorizontal, Search, Loader2, AlertCircle, User2, Clipboard } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';

interface OrdersTabProps {
  vendorId?: string;
}

type VendorOrder = {
  order_id: string;
  user_uuid: string;
  vendor_id: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status?: string;
  created_at: string;
};

function OrdersTab({ vendorId: vendorIdProp }: OrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [vendorId, setVendorId] = useState<string | undefined>(vendorIdProp || undefined);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [detailsModal, setDetailsModal] = useState<{ open: boolean; order?: any; items?: any[]; loading?: boolean; error?: string | null }>({ open: false });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        let vId = vendorIdProp || vendorId;
        if (!vId) {
          const auth:any = supabase.auth;
          const { data: { session } } = await auth.getSession();
          const uid = session?.user?.id;
          if (!uid) throw new Error('Not authenticated');
          const res = await fetch(API_ENDPOINTS.getAllVendorsAdmin, { headers: { 'Content-Type': 'application/json' } });
          if (!res.ok) throw new Error('Failed to fetch vendors');
          const json:any = await res.json();
          const found = Array.isArray(json.data) ? json.data.find((v: any) => v.user_uuid === uid || v.vendor_id === uid || v.user_id === uid) : null;
          vId = found?.vendor_id || found?.user_uuid || found?.user_id || undefined;
          setVendorId(vId);
        }
        if (!vId) throw new Error('Vendor not found');
        const ordRes = await fetch(API_ENDPOINTS.getOrdersByVendor(vId, 1, 100), { headers: { 'Content-Type': 'application/json' } });
        if (!ordRes.ok) throw new Error('Failed to fetch orders');
        const ordJson:any = await ordRes.json();
        if (!ordJson.success) throw new Error(ordJson.message || 'Failed to load orders');
        const list: VendorOrder[] = ordJson.data || [];
        setOrders(list);
        // Preload unique user profiles for display
        const uuids: string[] = Array.from(
          new Set(
            list
              .map((o: VendorOrder) => o.user_uuid)
              .filter((u): u is string => typeof u === 'string' && u.length > 0)
          )
        );
        if (uuids.length > 0) {
          const entries = await Promise.all(
            uuids.map(async (uuid: string) => {
              try {
                const r = await fetch(API_ENDPOINTS.getProfileByUUID(uuid), { headers: { 'Content-Type': 'application/json' } });
                const j:any = await r.json();
                if (r.ok && j.success && j.data) return [uuid, j.data] as const;
              } catch {}
              return [uuid, null] as const;
            })
          );
          const map: Record<string, any> = {};
          entries.forEach(([k, v]) => { map[k] = v; });
          setUserMap(map);
        }
      } catch (e:any) {
        setError(e.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorIdProp]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const user = userMap[order.user_uuid];
      const name = (user?.full_name || '').toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const matchesSearch = order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) || order.user_uuid.toLowerCase().includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, filterStatus]);

  const copyToClipboard = (text: string) => {
    try {
      void navigator.clipboard.writeText(text);
    } catch {}
  };

  const openDetails = async (orderId: string) => {
    setDetailsModal({ open: true, loading: true });
    try {
      const res = await fetch(API_ENDPOINTS.getOrder(orderId), { headers: { 'Content-Type': 'application/json' } });
      const j:any = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || 'Failed to fetch order');
      setDetailsModal({ open: true, loading: false, order: j.data, items: j.data.items || [] });
    } catch (e:any) {
      setDetailsModal({ open: true, loading: false, error: e.message || 'Failed to load order' });
    }
  };

  const closeDetails = () => setDetailsModal({ open: false });

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(API_ENDPOINTS.updateOrderStatus(orderId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const j:any = await res.json();
      if (!res.ok || !j.success) throw new Error(j.message || 'Failed to update status');
      setOrders((prev) => prev.map((o) => (o.order_id === orderId ? { ...o, status } : o)));
    } catch (e:any) {
      setError(e.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage and track your customer orders</p>
      </div>
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="size-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative inline-block">
          <div className="flex">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={() => {}}
            >
              <Filter className="mr-2 size-4 text-gray-500" />
              Filter
              <ChevronDown className="ml-1 size-4 text-gray-500" />
            </button>
          </div>
          {/* Filter dropdown would go here */}
        </div>
      </div>
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto mb-4 size-6 animate-spin text-green-600" />
          <p className="text-sm text-gray-600">Loading orders...</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 mb-4">
          <div className="flex items-center gap-2"><AlertCircle className="size-4" /><span>{error}</span></div>
        </div>
      )}
      {/* Orders Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    {(() => {
                      const u = userMap[order.user_uuid];
                      return (
                        <div className="flex items-center gap-3">
                          {u?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <Image width={200} height={200} src={u.avatar_url} alt={u.full_name || 'Avatar'} className="size-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"><User2 className="size-4" /></div>
                          )}
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{u?.full_name || 'Customer'}</div>
                            <div className="text-xs text-gray-500">{u?.email || order.user_uuid}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <button type="button" onClick={() => copyToClipboard(order.order_id)} title="Copy Order ID" className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"><Clipboard className="size-4" /></button>
                      <span>{order.order_id}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">₹{order.total_amount}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-700">{order.payment_status || 'pending'}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button type='button' onClick={() => openDetails(order.order_id)} className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="View details">
                        <Eye className="size-4" />
                      </button>
                      <button type='button' className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-700">
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detailsModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
              <button type="button" onClick={() => (setDetailsModal({ open: false }))} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            {detailsModal.loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-green-600" />
              </div>
            )}
            {detailsModal.error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{detailsModal.error}</div>
            )}
            {detailsModal.order && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-gray-600">Order ID</div>
                    <div className="font-medium text-gray-900">{detailsModal.order.order_id}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Placed On</div>
                    <div className="font-medium text-gray-900">{new Date(detailsModal.order.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total</div>
                    <div className="font-medium text-gray-900">₹{detailsModal.order.total_amount}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className="font-medium text-gray-900">{detailsModal.order.status}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-semibold text-gray-900">Items</div>
                  <div className="overflow-hidden rounded border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Product</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {detailsModal.items?.map((it, idx) => (
                          <tr key={idx}>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{it.product_title || it.product_id}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700">{it.quantity}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700">₹{it.unit_price}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">₹{it.total_price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersTab;