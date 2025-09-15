/* eslint-disable no-unused-vars */
"use client";
import  { useEffect, useMemo, useState } from 'react';
import { Star, Search, Filter, ChevronDown, Loader2, AlertCircle, User2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/utils/supabase/client';

interface VendorReview {
  review_id: string;
  product_id: string;
  product_title?: string | null;
  user_uuid: string;
  likes: number;
  disliked_by: string[];
  liked_by: string[];
  dislikes: number;
  comments: string;
  replies: Array<{ user_uuid: string; comment: string; created_at: string }>;
  created_at: string;
}

interface ReviewsTabProps {
  vendorId?: string; // if not passed, infer from logged in vendor profile
}

function ReviewsTab({ vendorId: vendorIdProp }: ReviewsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [vendorId, setVendorId] = useState<string | undefined>(vendorIdProp || undefined);
  const [userModal, setUserModal] = useState<{ open: boolean; user_uuid?: string; user?: any; loading?: boolean; error?: string | null }>({ open: false });

  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        setLoading(true);
        let vId = vendorIdProp || vendorId;
        if (!vId) {
          const { data: { session } } = await supabase.auth.getSession();
          const uid = session?.user?.id;
          if (!uid) throw new Error('Not authenticated');
          const res = await fetch(API_ENDPOINTS.getAllVendorsAdmin, { headers: { 'Content-Type': 'application/json' } });
          if (!res.ok) throw new Error('Failed to fetch vendors');
          const json:any = await res.json();
          const found = Array.isArray(json.data) ? json.data.find((v: any) => v.user_uuid === uid || v.vendor_id === uid || v.user_id === uid) : null;
          vId = found?.vendor_id || found?.user_uuid || found?.user_id || null;
          setVendorId(vId);
        }
        if (!vId) throw new Error('Vendor not found');
        const reviewsRes = await fetch(API_ENDPOINTS.getReviewsByVendorID(vId, { sortBy: 'newest', page: 1, limit: 50 }), { headers: { 'Content-Type': 'application/json' } });
        if (!reviewsRes.ok) throw new Error('Failed to fetch vendor reviews');
        const reviewsJson:any = await reviewsRes.json();
        if (!reviewsJson.success) throw new Error(reviewsJson.message || 'Failed to load reviews');
        setReviews(reviewsJson.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorIdProp]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const productTitle = (review.product_title || '').toLowerCase();
      const comment = (review.comments || '').toLowerCase();
      const matchesSearch = productTitle.includes(searchTerm.toLowerCase()) || comment.includes(searchTerm.toLowerCase());
      const matchesFilter = filterRating === 'all';
      return matchesSearch && matchesFilter;
    });
  }, [reviews, searchTerm, filterRating]);

  const openUserModal = async (user_uuid: string) => {
    setUserModal({ open: true, user_uuid, loading: true, error: null });
    try {
      const res = await fetch(API_ENDPOINTS.getProfileByUUID(user_uuid), { headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed to fetch user');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load user');
      setUserModal({ open: true, user_uuid, user: json.data, loading: false, error: null });
    } catch (e: any) {
      setUserModal({ open: true, user_uuid, user: null, loading: false, error: e.message || 'Failed to load user' });
    }
  };

  const closeUserModal = () => setUserModal({ open: false });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600">Manage customer reviews for your products</p>
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="size-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="Search reviews..."
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
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto mb-4 size-6 animate-spin text-green-600" />
          <p className="text-sm text-gray-600">Loading reviews...</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2"><AlertCircle className="size-4" /><span>{error}</span></div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.review_id} className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <button type="button" onClick={() => openUserModal(review.user_uuid)} className="mr-4 flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200">
                    <User2 className="size-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Reviewer: {review.user_uuid.slice(0,8)}...</h3>
                    <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Likes: {review.likes} · Dislikes: {review.dislikes}</span>
                </div>
              </div>
              <div className="mb-3">
                <h4 className="mb-1 text-sm font-medium text-gray-900">Product: {review.product_title || review.product_id}</h4>
                <p className="text-sm text-gray-700">{review.comments}</p>
              </div>
              {review.replies?.length > 0 && (
                <div className="mt-3 rounded-md bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-700">Replies</p>
                  <div className="space-y-2">
                    {review.replies.map((r, idx) => (
                      <div key={idx} className="rounded border border-gray-200 bg-white p-2">
                        <div className="mb-1 flex items-center justify-between">
                          <button type="button" onClick={() => openUserModal(r.user_uuid)} className="text-xs font-medium text-green-700 hover:underline">{r.user_uuid.slice(0,8)}...</button>
                          <span className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-700">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredReviews.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gray-100">
                <Star className="size-6 text-gray-400" />
              </div>
              <h3 className="mb-1 text-base font-medium text-gray-900">No reviews found</h3>
              <p className="text-sm text-gray-500">{searchTerm ? 'Try adjusting your search or filter criteria' : 'You have no reviews yet'}</p>
            </div>
          )}
        </div>
      )}

      {userModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button type="button" onClick={closeUserModal} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            {userModal.loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-green-600" />
              </div>
            )}
            {userModal.error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{userModal.error}</div>
            )}
            {userModal.user && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="font-medium text-gray-700">Name:</span><span>{userModal.user.full_name || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><span className="font-medium text-gray-700">Email:</span><span>{userModal.user.email || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><span className="font-medium text-gray-700">Phone:</span><span>{userModal.user.phone || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><span className="font-medium text-gray-700">City:</span><span>{userModal.user.city || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><span className="font-medium text-gray-700">State:</span><span>{userModal.user.state || 'N/A'}</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewsTab;