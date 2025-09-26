import React, { useEffect, useCallback } from 'react'
import { MinusCircle, PlusCircle, Heart, ShieldCheck, Truck, MapPin, Store, Leaf, Award, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProductDataType from '@/types/ProductData'
import { useState } from 'react'
import { API_ENDPOINTS } from '@/config/api'
import { supabase } from '@/utils/supabase/client'
import { UserProfile } from '@/types/user'
import fetchUserProfile from '@/helpers/fetchUserProfile'
import SignIn from '../auth/Sign-in'

type VendorData = {
  name?: string
  business_name?: string
  slug: string
  is_verified?: number
  vendor_id?: string
}

type BuyBoxProps = {
  product: ProductDataType
  vendorData?: VendorData
  quantity: number
  onQuantityChange: (increment: boolean) => void
  onAddToCart: () => void
  onAddToWishlist: () => void
  inputId?: string
  deliveryDate?: string
  sellerName?: string
  pricePerUnit?: number;
  isInCart?: boolean;
  isInWishlist?: boolean;
  loadingCart?: boolean;
  loadingWishlist?: boolean;
}

// Utility for Indian currency formatting
const formatIndianPrice = (price: number): string =>
  price.toLocaleString('en-IN')

const BuyBox: React.FC<BuyBoxProps> = ({
  product,
  vendorData,
  quantity,
  onQuantityChange,
  onAddToCart,
  onAddToWishlist,
  inputId = 'quantity-input',
  deliveryDate = 'Tuesday, 27 May',
  sellerName = 'PlantoMart',
  isInCart = false,
  isInWishlist = false,
  loadingCart = false,
  loadingWishlist = false,
}) => {
  const router = useRouter()
  const { price, discountPrice, discountPercent, quantity: stockQty, brand } = product

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [currentPageUrl, setCurrentPageUrl] = useState('')

  // Calculate the current effective price per unit
  const pricePerUnit = discountPrice ?? price
  const originalPricePerUnit = price
  
  // Calculate total prices based on quantity
  const totalPrice = pricePerUnit * quantity
  const totalOriginalPrice = originalPricePerUnit * quantity
  const totalSavings = discountPrice ? (totalOriginalPrice - totalPrice) : 0

  // Get current page URL
  const getCurrentPageUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.location.href
    }
    return ''
  }, [])

  // Check user authentication status
  const checkUserSession = useCallback(async () => {
    try {
      setIsCheckingAuth(true)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setUser(null)
        return
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking user session:', error)
      setUser(null)
    } finally {
      setIsCheckingAuth(false)
    }
  }, [])

  // Initialize component
  useEffect(() => {
    setCurrentPageUrl(getCurrentPageUrl())
    checkUserSession()
  }, [checkUserSession, getCurrentPageUrl])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
        setIsSignInOpen(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Handle authentication requirement
  const requireAuth = useCallback((action: () => void | Promise<void>) => {
    if (!isAuthenticated && !isCheckingAuth) {
      setIsSignInOpen(true)
      return
    }
    
    if (isAuthenticated) {
      action()
    }
  }, [isAuthenticated, isCheckingAuth])

  // Enhanced Add to Cart with auth check
  const handleAddToCart = useCallback(() => {
    requireAuth(() => {
      onAddToCart()
    })
  }, [onAddToCart, requireAuth])

  // Enhanced Add to Wishlist with auth check
  const handleAddToWishlist = useCallback(() => {
    requireAuth(() => {
      onAddToWishlist()
    })
  }, [onAddToWishlist, requireAuth])

  // Enhanced Payment handling with robust auth and error handling
  const handlePayment = useCallback(async (amount: number, productName: string) => {
    if (!isAuthenticated && !isCheckingAuth) {
      setIsSignInOpen(true)
      return
    }

    if (amount <= 0) {
      alert('Invalid amount. Please check your selection.')
      return
    }

    if (!user) {
      alert('Please sign in to continue with your purchase.')
      setIsSignInOpen(true)
      return
    }

    setIsProcessing(true)

    try {
      // Validate required data
      if (!product.product_id) {
        throw new Error('Product information is missing')
      }

      // Create order
      const orderResponse = await fetch('/api/razorpay/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: `order_${product.product_id}_${Date.now()}`,
          notes: {
            product_id: product.product_id,
            product_title: productName,
            quantity: quantity.toString(),
            user_id: user.user_uuid
          }
        }),
      })
      
      if (!orderResponse.ok) {
        throw new Error(`Failed to create order: ${orderResponse.statusText}`)
      }
      
      const orderData:any = await orderResponse.json()
      
      if (!orderData.id) {
        throw new Error('Invalid order response')
      }

      // Verify Razorpay key is available
      // const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_LIVE_KEY_ID
      const razorpayKey = orderData.key;
      // console.log("Razorpay key is: ", razorpayKey);
      if (!razorpayKey) {
        throw new Error('Payment configuration error')
      }

      // Setup Razorpay payment options
      const paymentOptions = {
        key: razorpayKey,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "PlantoMart",
        description: `Purchase of ${productName}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/razorpay/verifyOrder", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            
            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed')
            }
            
            const verificationData:any = await verifyResponse.json()
            
            if (verificationData.isOk) {
              // Create order record
              try {
                const vendor_id = vendorData?.vendor_id || (product as any)?.vendorID
                
                const orderPayload = {
                  user_uuid: user.user_uuid,
                  vendor_id,
                  items: [
                    {
                      product_id: product.product_id,
                      product_title: product.title,
                      quantity,
                      unit_price: pricePerUnit
                    }
                  ],
                  total_amount: Math.round(amount),
                  currency: 'INR',
                  payment_id: response.razorpay_payment_id,
                  payment_method: 'razorpay',
                  payment_status: 'paid',
                  order_id: response.razorpay_order_id,
                  notes: `Razorpay order: ${response.razorpay_order_id}`,
                  created_at: new Date().toISOString()
                }

                const orderCreateResponse = await fetch(API_ENDPOINTS.createOrder, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${user.user_uuid}` // If your API requires auth
                  },
                  body: JSON.stringify(orderPayload)
                })

                if (!orderCreateResponse.ok) {
                  console.error('Failed to create order record')
                  // Still show success since payment went through
                }

                // Success feedback
                alert("🎉 Payment successful! Your order has been confirmed.")
                
                // Optionally redirect to order confirmation page
                // router.push(`/orders/${response.razorpay_order_id}`)
                
              } catch (orderError) {
                console.error('Failed to create order record:', orderError)
                alert("Payment successful, but there was an issue recording your order. Please contact support.")
              }
            } else {
              throw new Error('Payment verification failed')
            }
          } catch (error) {
            console.error('Payment handler error:', error)
            alert("There was an issue processing your payment. Please contact support if amount was debited.")
          }
        },
        prefill: {
          name: user.full_name || user.email || "Customer",
          email: user.email || "",
          contact: user.phone || ""
        },
        theme: {
          color: "#16a34a", // Green theme to match PlantoMart
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false)
            console.log('Payment modal dismissed')
          },
          escape: true,
          backdropclose: false
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      }

      // Initialize Razorpay payment
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const razorpay = new (window as any).Razorpay(paymentOptions)
        
        razorpay.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response.error)
          alert(`Payment failed: ${response.error.description || 'Unknown error'}`)
          setIsProcessing(false)
        })
        
        razorpay.open()
      } else {
        throw new Error('Payment system is not available. Please refresh the page and try again.')
      }
      
    } catch (error) {
      console.error("Payment error:", error)
      const errorMessage = error instanceof Error ? error.message : "There was an error processing your payment. Please try again."
      alert(errorMessage)
    } finally {
      // Only reset if payment modal didn't open successfully
      setTimeout(() => setIsProcessing(false), 1000)
    }
  }, [isAuthenticated, isCheckingAuth, user, product, quantity, pricePerUnit, vendorData])

  // Handle Buy Now button click
  const handleBuyNow = useCallback(() => {
    const amount = Math.round(pricePerUnit * quantity)
    handlePayment(amount, product.title)
  }, [pricePerUnit, quantity, product.title, handlePayment])

  // Close sign in modal
  const handleCloseSignIn = useCallback(() => {
    setIsSignInOpen(false)
  }, [])

  return (
    <div className="lg:col-span-3">
      <div className="sticky top-24 overflow-hidden rounded-2xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
        {/* Header with nature theme */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Leaf className="h-5 w-5" />
              <span className="font-semibold">PlantoMart</span>
            </div>
            {vendorData?.is_verified === 1 && (
              <div className="flex items-center space-x-1">
                <Award className="h-4 w-4" />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Price Section with quantity adjustment */}
          <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900">₹{formatIndianPrice(totalPrice)}</span>
                  <span className="text-sm font-medium text-green-600">
                    (₹{formatIndianPrice(pricePerUnit)} each)
                  </span>
                </div>
                {discountPrice !== undefined && (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      ₹{formatIndianPrice(totalOriginalPrice)}
                    </span>
                    {discountPercent && (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Save {discountPercent}% • ₹{formatIndianPrice(totalSavings)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-2 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">FREE delivery by</span>
              <span className="font-semibold text-green-700">{deliveryDate}</span>
            </div>
          </div>

          {/* Authentication status indicator */}
          {!isAuthenticated && !isCheckingAuth && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <div className="flex items-center space-x-2 text-yellow-800">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-sm font-medium">Sign in required for purchase</span>
              </div>
            </div>
          )}

          {/* Stock Status with visual indicator */}
          <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${stockQty > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${stockQty > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {stockQty > 0 ? `In stock (${stockQty} available)` : 'Out of stock'}
              </span>
            </div>
            {stockQty > 0 && stockQty <= 5 && (
              <span className="text-xs text-orange-600 font-medium">Only {stockQty} left!</span>
            )}
          </div>

          {/* Enhanced Quantity Selector */}
          <div className="mb-6">
            <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-gray-700">
              Quantity:
            </label>
            <div className="flex items-center justify-center rounded-lg bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => onQuantityChange(false)}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MinusCircle className="h-5 w-5" />
              </button>
              
              <div className="mx-4 flex flex-col items-center">
                <input
                  type="text"
                  id={inputId}
                  value={quantity}
                  readOnly
                  className="w-16 border-0 bg-transparent text-center text-xl font-bold text-gray-900"
                />
                <span className="text-xs text-gray-500">items</span>
              </div>
              
              <button
                type="button"
                onClick={() => onQuantityChange(true)}
                disabled={quantity >= stockQty}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 transition-all hover:bg-green-200 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stockQty <= 0 || isCheckingAuth}
              className={`group relative w-full overflow-hidden rounded-xl py-4 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg ${isInCart ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600'}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:animate-pulse group-hover:opacity-20" />
              <span className="relative flex items-center justify-center space-x-2">
                {loadingCart || isCheckingAuth ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    <span>{isCheckingAuth ? 'Loading...' : 'Processing...'}</span>
                  </>
                ) : isInCart ? (
                  <>
                    <Check className="mr-2 size-5" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">🛒</span>
                    <span>{!isAuthenticated && !isCheckingAuth ? 'Sign in to Add to Cart' : 'Add to Cart'}</span>
                  </>
                )}
              </span>
            </button>

            {/* Buy Now Button */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={stockQty <= 0 || isProcessing || isCheckingAuth}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:animate-pulse group-hover:opacity-20" />
              <span className="relative flex items-center justify-center space-x-2">
                {isProcessing || isCheckingAuth ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    <span>{isCheckingAuth ? 'Loading...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">⚡</span>
                    <span>{!isAuthenticated && !isCheckingAuth ? 'Sign in to Buy Now' : 'Buy Now'}</span>
                  </>
                )}
              </span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={handleAddToWishlist}
              disabled={isCheckingAuth}
              className={`group flex w-full items-center justify-center space-x-2 rounded-xl border-2 py-4 text-base font-medium transition-all duration-300 ${isInWishlist ? 'border-pink-300 bg-pink-50 text-pink-700' : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700'}`}
            >
              {loadingWishlist || isCheckingAuth ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>{isCheckingAuth ? 'Loading...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Heart className={`h-5 w-5 transition-colors ${isInWishlist ? 'fill-pink-500 text-pink-500' : 'group-hover:text-pink-500'}`} />
                  <span>
                    {!isAuthenticated && !isCheckingAuth 
                      ? 'Sign in to Add to Wishlist' 
                      : isInWishlist 
                        ? 'Remove from Wishlist' 
                        : 'Add to Wishlist'
                    }
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Enhanced Shipping and Security Info */}
          <div className="mt-6 space-y-4">
            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 rounded-lg bg-blue-50 p-3 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">100% Secure Transaction</span>
            </div>

            {/* Shipping Information */}
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h4 className="mb-3 flex items-center space-x-2 text-sm font-semibold text-gray-800">
                <MapPin className="h-4 w-4 text-green-600" />
                <span>Shipping Information</span>
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Ships from:</span>
                  <span className="font-medium text-gray-800">{sellerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sold by:</span>
                  {vendorData ? (
                    <Link 
                      href={`/vendor/store/${vendorData.slug}`}
                      className="flex items-center space-x-1 font-medium text-green-600 hover:text-green-700 hover:underline"
                    >
                      <Store className="h-3 w-3" />
                      <span>{vendorData.name || vendorData.business_name || brand}</span>
                      {vendorData.is_verified === 1 && (
                        <Award className="h-3 w-3 text-blue-500" />
                      )}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-800">{brand}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Nature-themed guarantee */}
            <div className="rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 p-3">
              <div className="flex items-center space-x-2 text-green-800">
                <Leaf className="h-4 w-4" />
                <span className="text-xs font-medium">🌱 Healthy Plant Guarantee • 🚚 Safe Packaging • 💚 Eco-Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sign In Modal */}
      {isSignInOpen && (
        <SignIn 
          isOpen={isSignInOpen} 
          onClose={handleCloseSignIn} 
          redirectUrl={currentPageUrl}
        />
      )}
    </div>
  )
}

export default BuyBox