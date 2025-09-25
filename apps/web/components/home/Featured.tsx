"use client";
import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Check, Loader2, ArrowRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast, Toaster } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/config/api';
import { updateCartQuantity, removeFromCart, addWishlistItemToCart, removeFromWishlist, addToWishlist, safeLocalStorage } from '@/helpers/cart-and-wishlist/CRUD-Wishlist-and-Cart';
import { CartItem as CartItemType, WishlistItem as WishlistItemType } from '@/types/Cart';

// Utility for localStorage with expiry
const setWithExpiry = (key: string, value: any, ttl: number) => {
  const now = new Date();
  const item = {
    value,
    expiry: now.getTime() + ttl,
  };
  safeLocalStorage(key, item);
};

const getWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item = JSON.parse(itemStr);
    if (!item.expiry || !item.value) return null;
    const now = new Date();
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

// Define a Product type that's compatible with both Cart and Wishlist items
type Product = {
  product_id: string;
  title: string;
  price: number;
  discountPrice?: number;
  discountPercent?: number;
  image_gallery: string[];
  slug: string;
  brand: string;
  featured: boolean;
  category: string;
  id?: string;
};

// Helper functions to ensure type compatibility
const productToCartItem = (product: Product): CartItemType => {
  return {
    ...product,
    id: product.id || product.product_id,
    product_id: product.product_id,
    title: product.title,
    price: product.price,
    image_gallery: product.image_gallery,
    quantity: 1
  } as CartItemType;
};

const productToWishlistItem = (product: Product): WishlistItemType => {
  return {
    ...product,
    id: product.id || product.product_id,
    product_id: product.product_id,
    title: product.title,
    price: product.price,
    image_gallery: product.image_gallery
  } as WishlistItemType;
};

// Type guards to check if items have required fields
const isValidCartItem = (item: any): item is CartItemType => {
  return item && typeof item.product_id === 'string' && typeof item.title === 'string';
};

const isValidWishlistItem = (item: any): item is WishlistItemType => {
  return item && typeof item.product_id === 'string' && typeof item.title === 'string';
};

// Use CartItemType and WishlistItemType directly from imports
type CartItem = CartItemType;
type WishlistItem = WishlistItemType;

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  total: number;
}

const formatIndianPrice = (price: number) => {
  return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function Featured() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState<string | null>(null);
  const [loadingWishlist, setLoadingWishlist] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
    total: 0
  });

  // Fetch featured products with pagination
  const fetchFeaturedProducts = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = new URL(API_ENDPOINTS.getFeaturedProducts);
      url.searchParams.set('limit', '4');
      url.searchParams.set('offset', String((page - 1) * 4));
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch featured products');
      const json: any = await res.json();
      if (!json.success || !json.data) throw new Error(json.message || 'No featured products found');
      
      if (append) {
        setProducts(prev => [...prev, ...json.data]);
      } else {
        setProducts(json.data);
        // Cache only the first page
        if (page === 1) {
          setWithExpiry('plantomartFeatured', json.data, 2 * 60 * 60 * 1000);
        }
      }

      // Update pagination info
      if (json.pagination) {
        setPagination({
          currentPage: json.pagination.currentPage,
          totalPages: json.pagination.totalPages,
          hasMore: json.pagination.hasMore,
          total: json.pagination.total
        });
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch featured products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more products
  const loadMoreProducts = () => {
    if (pagination.hasMore && !loadingMore) {
      fetchFeaturedProducts(pagination.currentPage + 1, true);
    }
  };

  // On mount, check localStorage first
  useEffect(() => {
    setIsClient(true);
    const cached = getWithExpiry('plantomartFeatured');
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setProducts(cached);
      setLoading(false);
      // Still fetch fresh data to check if there are more products
      fetchFeaturedProducts(1, false);
    } else {
      fetchFeaturedProducts(1, false);
    }
    
    // Cart initialization with type validation
    try {
      const storedCart = localStorage.getItem('plantomartCart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          const validCartItems = parsedCart.filter(isValidCartItem);
          setCartItems(validCartItems);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // Don't remove the cart data, as it might be a temporary error
    }
    
    // Wishlist initialization with type validation
    try {
      const storedWishlist = localStorage.getItem('plantomartWishlist');
      if (storedWishlist) {
        const parsedWishlist = JSON.parse(storedWishlist);
        if (Array.isArray(parsedWishlist)) {
          const validWishlistItems = parsedWishlist.filter(isValidWishlistItem);
          setWishlistItems(validWishlistItems);
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      // Don't remove the wishlist data, as it might be a temporary error
    }
  }, []);

  // Dispatch cart update events
  useEffect(() => {
    if (isClient && cartItems.length >= 0) {
      const event = new CustomEvent('cartUpdated', { detail: cartItems });
      window.dispatchEvent(event);
    }
  }, [cartItems, isClient]);

  // Dispatch wishlist update events
  useEffect(() => {
    if (isClient && wishlistItems.length >= 0) {
      const event = new CustomEvent('wishlistUpdated', { detail: wishlistItems });
      window.dispatchEvent(event);
    }
  }, [wishlistItems, isClient]);

  const isInCart = (productId: string): boolean => {
    return cartItems.some(item => item.product_id === productId);
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  const toggleCart = (product: Product) => {
    setLoadingCart(product.product_id);
    setTimeout(() => {
      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.product_id === product.product_id);
        
        if (existingItemIndex >= 0) {
          // Remove from cart using helper function
          const newItems = removeFromCart(prevItems, product.product_id);
          setTimeout(() => toast.success(`${product.title} removed from cart`), 0);
          return newItems;
        } else {
          // Add to cart - convert Product to CartItem first
          const cartItem = productToCartItem(product);
          const newItems = addWishlistItemToCart(prevItems, cartItem);
          setTimeout(() => toast.success(`${product.title} added to cart`), 0);
          return newItems;
        }
      });
      setLoadingCart(null);
    }, 600);
  };

  const toggleWishlist = (product: Product) => {
    setLoadingWishlist(product.product_id);
    setTimeout(() => {
      setWishlistItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.product_id === product.product_id);
        
        if (existingItemIndex >= 0) {
          // Remove from wishlist using helper function
          const newItems = removeFromWishlist(prevItems, product.product_id);
          setTimeout(() => toast.success(`${product.title} removed from wishlist`), 0);
          return newItems;
        } else {
          // Add to wishlist - convert Product to WishlistItem first
          const wishlistItem = productToWishlistItem(product);
          const newItems = addToWishlist(prevItems, wishlistItem);
          setTimeout(() => toast.success(`${product.title} added to wishlist`), 0);
          return newItems;
        }
      });
      setLoadingWishlist(null);
    }, 400);
  };

  // Loading animation - show 4 skeletons for initial load
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4">
            <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-100 rounded mb-4" />
            <div className="h-8 w-full bg-gray-100 rounded mb-2" />
            <div className="h-8 w-full bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  // Loading more skeleton - show 4 additional skeletons
  const LoadingMoreSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-6">
      {[...Array(4)].map((_, i) => (
        <div key={`loading-more-${i}`} className="animate-pulse flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4">
            <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-100 rounded mb-4" />
            <div className="h-8 w-full bg-gray-100 rounded mb-2" />
            <div className="h-8 w-full bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  // Error UI
  if (error && !loading && products.length === 0) {
    return (
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center py-16">
            <h2 className="mb-4 text-2xl font-bold text-red-700 md:text-4xl">Oops! Couldn&apos;t load featured products</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              type="button"
              onClick={() => fetchFeaturedProducts(1, false)}
              disabled={loading}
              className="rounded-full border-2 border-green-600 px-6 py-2.5 font-medium text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50 md:px-8 md:py-3"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          }
        }}
      />
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 text-center md:mb-16">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 md:text-4xl">Featured Products</h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600 md:text-lg">
              Explore our most popular plant selections and eco-friendly essentials
            </p>
            {pagination.total > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Showing {products.length} of {pagination.total} featured products
              </p>
            )}
          </div>
          
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <div 
                    key={product.product_id} 
                    className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="relative">
                      <div className="aspect-square overflow-hidden">
                        <Image
                          width={500}
                          height={500} 
                          src={product.image_gallery && product.image_gallery.length > 0 ? product.image_gallery[0] : '/assets/placeholder.jpg'} 
                          alt={product.title} 
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/assets/placeholder.jpg';
                          }}
                        />
                      </div>
                      {product.featured && (
                        <span className="absolute left-4 top-4 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
                          Featured
                        </span>
                      )}
                      <button 
                        type='button'
                        className={`absolute right-4 top-4 rounded-full p-2 shadow-md transition-all duration-200 ${
                          isInWishlist(product.product_id) 
                            ? 'bg-red-50 hover:bg-red-100' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => toggleWishlist(product)}
                        disabled={loadingWishlist === product.product_id}
                        aria-label={isInWishlist(product.product_id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        {loadingWishlist === product.product_id ? (
                          <Loader2 className="size-5 animate-spin text-gray-600" />
                        ) : (
                          <Heart 
                            className={`size-5 transition-colors ${
                              isInWishlist(product.product_id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-600'
                            }`} 
                          />
                        )}
                      </button>
                    </div>
                    <div className="flex grow flex-col p-4 md:p-6">
                      <h3 className="mb-2 line-clamp-1 text-base font-bold text-gray-900 md:text-lg">{product.title}</h3>
                      <div className="mb-4 flex items-center gap-2">
                        <span className="font-bold text-green-600 text-lg">₹{formatIndianPrice(product.discountPrice ?? product.price)}</span>
                        {product.discountPrice && product.discountPrice < product.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">₹{formatIndianPrice(product.price)}</span>
                            {product.discountPercent && (
                              <span className="ml-1 text-xs font-medium text-green-600">-{product.discountPercent}%</span>
                            )}
                          </>
                        )}
                      </div>
                      <Link 
                        href={`/product/${product.slug}`} 
                        className="mb-3 flex items-center justify-center rounded-lg border border-green-600 bg-white px-4 py-2 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 md:text-base"
                      >
                        View Details
                        <ArrowRight className="ml-2 size-4" />
                      </Link>
                      <button 
                        type='button'
                        className={`flex w-full items-center justify-center rounded-lg px-4 py-2.5 font-medium transition-all duration-200 ${
                          isInCart(product.product_id)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-100 text-gray-800 hover:bg-green-600 hover:text-white'
                        }`}
                        onClick={() => toggleCart(product)}
                        disabled={loadingCart === product.product_id}
                      >
                        {loadingCart === product.product_id ? (
                          <Loader2 className="mr-2 size-5 animate-spin" />
                        ) : isInCart(product.product_id) ? (
                          <>
                            <Check className="mr-2 size-5" />
                            <span className="text-sm md:text-base">Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 size-5" />
                            <span className="text-sm md:text-base">Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Loading more skeleton */}
              {loadingMore && <LoadingMoreSkeleton />}
              
              {/* Show message if no products */}
              {products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No featured products available at the moment.</p>
                </div>
              )}
              
              {/* Load More Button */}
              {pagination.hasMore && !loadingMore && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={loadMoreProducts}
                    className="inline-flex items-center rounded-full border-2 border-green-600 px-6 py-2.5 font-medium text-green-600 transition-colors hover:bg-green-50 md:px-8 md:py-3"
                  >
                    Load More Products
                    <ChevronDown className="ml-2 size-4" />
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* View All Products Button */}
          <div className="mt-10 text-center md:mt-12">
            <Link 
              href="/products"
              className="inline-block rounded-full border-2 border-green-600 px-6 py-2.5 font-medium text-green-600 transition-colors hover:bg-green-50 md:px-8 md:py-3"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Featured;