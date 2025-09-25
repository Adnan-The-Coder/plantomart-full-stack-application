// components/Navbar.js - Ultra-Responsive Navbar with Fixed Positioning
"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShoppingCart, 
  User, 
  Search, 
  Truck, 
  Heart, 
  X, 
  Menu, 
  ChevronDown, 
  Phone, 
  LogOut,
  Home,
  Store,
  BookOpen,
  Building2,
  MessageCircle,
  Leaf,
  Package,
  Shovel,
  Minus,
  Plus,
  ArrowRight
} from "lucide-react";

// Your existing imports
import { supabase } from '../utils/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
import SignIn from './auth/Sign-in';
import fetchUserProfile from '@/helpers/fetchUserProfile';

// Navigation data structure
const navigationData = {
  vendors: [
    { name: 'Show Bageecha', href: '/vendors/show-bageecha' },
    { name: 'Super Saaf', href: '/vendors/super-saaf' },
    { name: 'Leaf Grid', href: '/vendors/leaf-grid' },
    { name: 'Plantify', href: '/vendors/plantify' },
    { name: 'Surface Gauge', href: '#', disabled: true, comingSoon: true }
  ],
  vendorActions: [
    { name: 'Browse Vendors', href: '/vendors', icon: Store },
    { name: 'Start Selling', href: '/vendor/register', icon: Package },
    { name: 'Help & Guides', href: '/guides', icon: BookOpen },
    { name: 'My Seller Hub', href: '/vendor/dashboard', icon: Building2 }
  ],
  blog: [
    { name: 'Green Living', href: '/blog/green-living' },
    { name: 'Plant Care 101', href: '/blog/plant-care-101' },
    { name: 'Indoor Jungle', href: '/blog/indoor-jungle' },
    { name: 'Seasonal Gardening', href: '/blog/seasonal-gardening' }
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' }
  ],
  categories: {
    plants: [
      'Spider plant', 'ZZ Plant', 'Lucky Bonsai', 'Golden Yellow Sanseveria',
    ],
    planters: [
      'Amalfi Pots', 'Empresso Pots', 'Grandeur pots', 'Imperia Pots',
    ],
    gardeningKits: [
      'Starter Kits', 'Herb Garden Kits', 'Vegetable Garden Kits', 'Succulent Kits',
      'Seed Starting Kits', 'Tool Sets', 'Fertilizer Kits', 'Watering Kits'
    ]
  }
};

// Interfaces
interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  tag?: string;
  numericPrice: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

function Navbar() {
  // State management
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navbarRef = useRef(null);

  // Handle window resize for proper dropdown positioning
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Close dropdowns on resize to prevent positioning issues
      setActiveDropdown(null);
      setActiveCategoryDropdown(null);
    };

    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Enhanced scroll handler
  useEffect(() => {
    let timeoutId:any = null;
    
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (scrolled !== isScrolled) {
        setIsScrolled(scrolled);
      }
    };
    
    const throttledScroll = () => {
      if (timeoutId === null) {
        timeoutId = requestAnimationFrame(() => {
          handleScroll();
          timeoutId = null;
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', throttledScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', throttledScroll);
        if (timeoutId !== null) {
          cancelAnimationFrame(timeoutId);
        }
      };
    }
  }, [isScrolled]);

  // Initialize client-side data
  useEffect(() => {
    setIsClient(true);
    loadCartAndWishlist();
    checkUserSession();

    const handleCartUpdate = () => loadCartAndWishlist();
    const handleWishlistUpdate = () => loadCartAndWishlist();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'plantomartCart' || event.key === 'plantomartWishlist') {
        loadCartAndWishlist();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchUserProfile(session.user.id).then(profile => setUser(profile));
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      window.removeEventListener('storage', handleStorageChange);
      subscription.unsubscribe();
    };
  }, []);

  // Your existing functions
  const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsUserMenuOpen(false);
  };

  const loadCartAndWishlist = () => {
    if (typeof window !== 'undefined') {
      const storedCart = localStorage.getItem('plantomartCart');
      const storedWishlist = localStorage.getItem('plantomartWishlist');
      
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (e) {
          console.error("Failed to parse cart data:", e);
          setCartItems([]);
        }
      }
      
      if (storedWishlist) {
        try {
          setWishlistItems(JSON.parse(storedWishlist));
        } catch (e) {
          console.error("Failed to parse wishlist data:", e);
          setWishlistItems([]);
        }
      }
    }
  };

  // Enhanced click outside handler
  useEffect(() => {
    const handleClickOutside = (event:any) => {
      let clickedOutside = true;
      
      // Check all dropdown refs
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target)) {
          clickedOutside = false;
        }
      });
      
      Object.values(categoryDropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target)) {
          clickedOutside = false;
        }
      });
      
      if (clickedOutside) {
        setActiveDropdown(null);
        setActiveCategoryDropdown(null);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Enhanced body scroll prevention
  useEffect(() => {
    if (isMobileMenuOpen || isCartOpen || isWishlistOpen || isSignInOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isMobileMenuOpen, isCartOpen, isWishlistOpen, isSignInOpen]);

  // Utility functions
  const closeAllDrawers = () => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
    setIsWishlistOpen(false);
    setIsSignInOpen(false);
    setIsMobileSearchOpen(false);
    setIsUserMenuOpen(false);
    setActiveDropdown(null);
    setActiveCategoryDropdown(null);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
    setIsMobileMenuOpen(false);
    setIsWishlistOpen(false);
  };

  const toggleWishlist = () => {
    setIsWishlistOpen(!isWishlistOpen);
    setIsMobileMenuOpen(false);
    setIsCartOpen(false);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.numericPrice * item.quantity), 0);
  };

  const updateCartQuantity = (id:any, newQuantity:any) => {
    if (newQuantity <= 0) return;
    const updatedCart = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('plantomartCart', JSON.stringify(updatedCart));
    
    const event = new CustomEvent('cartUpdated', { detail: updatedCart });
    window.dispatchEvent(event);
  };

  const removeFromCart = (id:any) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('plantomartCart', JSON.stringify(updatedCart));
    
    const event = new CustomEvent('cartUpdated', { detail: updatedCart });
    window.dispatchEvent(event);
  };

  const removeFromWishlist = (id:any) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== id);
    setWishlistItems(updatedWishlist);
    localStorage.setItem('plantomartWishlist', JSON.stringify(updatedWishlist));
    
    const event = new CustomEvent('wishlistUpdated', { detail: updatedWishlist });
    window.dispatchEvent(event);
  };

  const addWishlistItemToCart = (product:any) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    let updatedCart;
    if (existingItemIndex >= 0) {
      updatedCart = cartItems.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      const newItem = { ...product, quantity: 1 };
      updatedCart = [...cartItems, newItem];
    }
    
    setCartItems(updatedCart);
    localStorage.setItem('plantomartCart', JSON.stringify(updatedCart));
    
    const event = new CustomEvent('cartUpdated', { detail: updatedCart });
    window.dispatchEvent(event);
  };

  const displayCount = (count:any) => {
    return count > 9 ? "9+" : count.toString();
  };

  // Smart dropdown positioning function
  const getDropdownPosition = (buttonRef:any, dropdownWidth = 400) => {
    if (!buttonRef || !buttonRef.current) return { left: '0px', transform: 'translateX(0)' };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const buttonCenter = buttonRect.left + buttonRect.width / 2;
    
    // Try to center dropdown under button
    let leftPosition = buttonCenter - dropdownWidth / 2;
    
    // Adjust if dropdown would go off-screen
    const padding = 16; // 16px padding from edges
    if (leftPosition < padding) {
      leftPosition = padding;
    } else if (leftPosition + dropdownWidth > viewportWidth - padding) {
      leftPosition = viewportWidth - dropdownWidth - padding;
    }
    
    return {
      left: `${leftPosition}px`,
      transform: 'translateX(0)'
    };
  };

  // Enhanced Dropdown Menu Component with Smart Positioning
  const DropdownMenu = ({ items, title, isActive, onToggle, type = 'simple' }:any) => {
    const buttonRef = useRef(null);
    
    useEffect(() => {
      (dropdownRefs as any).current[title] = buttonRef.current;
    }, [title]);

    return (
      <div className="relative" ref={buttonRef}>
        <button
          className="flex items-center space-x-1 text-gray-700 hover:text-green-600 transition-all duration-200 py-3 px-4 rounded-xl hover:bg-green-50 font-medium"
          onClick={onToggle}
        >
          <span>{title}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
        </button>
        
        {isActive && (
          <>
            {/* Full screen overlay for mobile */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:bg-transparent lg:backdrop-blur-none"
              onClick={() => setActiveDropdown(null)}
            />
            <div 
              className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ${
                type === 'vendors' 
                  ? 'top-20 left-4 right-4 lg:absolute lg:top-full lg:left-auto lg:right-auto lg:w-screen lg:max-w-5xl'
                  : 'top-20 left-4 right-4 lg:absolute lg:top-full lg:left-auto lg:right-auto lg:w-64'
              }`}
              style={windowWidth >= 1024 ? getDropdownPosition(buttonRef, type === 'vendors' ? 800 : 250) : {}}
            >
              {type === 'vendors' ? (
                <div className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Vendors List */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                        <Store className="w-4 h-4 mr-2" />
                        Vendors
                      </h3>
                      {navigationData.vendors.map((vendor, index) => (
                        <Link
                          key={index}
                          href={vendor.href}
                          className={`group flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                            vendor.disabled 
                              ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                              : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                          }`}
                          onClick={vendor.disabled ? (e) => e.preventDefault() : closeAllDrawers}
                        >
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            {vendor.comingSoon && (
                              <div className="text-xs text-gray-400 italic">Coming soon</div>
                            )}
                          </div>
                          {!vendor.disabled && (
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          )}
                        </Link>
                      ))}
                    </div>
                    
                    {/* Vendor Actions */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        Grow with Plantomart
                      </h3>
                      {navigationData.vendorActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={index}
                            href={action.href}
                            className="group flex items-center px-4 py-3 text-sm text-gray-700 rounded-xl hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                            onClick={closeAllDrawers}
                          >
                            <Icon className="w-5 h-5 mr-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                            <span className="font-medium">{action.name}</span>
                            <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Link>
                        );
                      })}
                    </div>
                    
                    {/* Promo Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                      <div className="relative z-10 text-center">
                        <div className="text-3xl font-bold mb-2">25% OFF</div>
                        <div className="text-sm font-medium mb-4 opacity-90">Your first order</div>
                        <button className="px-6 py-3 bg-white text-green-600 text-sm rounded-xl hover:bg-gray-50 transition-colors duration-200 font-bold shadow-lg">
                          Shop Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {items.map((item:any, index:any) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block px-6 py-3 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 transition-colors duration-200 font-medium"
                      onClick={closeAllDrawers}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Enhanced Category Dropdown with Smart Positioning
  const CategoryDropdown = ({ category, items, icon: Icon, isActive, onToggle }:any) => {
    const buttonRef = useRef(null);
    
    useEffect(() => {
      (categoryDropdownRefs as any).current[category] = buttonRef.current;
    }, [category]);

    return (
      <div className="relative" ref={buttonRef}>
        <button
          className="flex items-center space-x-2 px-6 py-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 font-medium group"
          onClick={onToggle}
        >
          <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          <span>{category}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
        </button>
        
        {isActive && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:bg-transparent lg:backdrop-blur-none"
              onClick={() => setActiveCategoryDropdown(null)}
            />
            <div 
              className="fixed top-32 left-4 right-4 lg:absolute lg:top-full lg:left-auto lg:right-auto lg:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              style={windowWidth >= 1024 ? getDropdownPosition(buttonRef, 320) : {}}
            >
              <div className="p-4">
                <div className="px-2 pb-3 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center">
                    <Icon className="w-4 h-4 mr-2 text-green-600" />
                    {category}
                  </h4>
                </div>
                <div className="py-2 max-h-64 overflow-y-auto">
                  {items.map((item:any, index:any) => (
                    <Link
                      key={index}
                      href={`/product/${item.toLowerCase().replace(/\s+/g, '-')}`}
                      className="group flex items-center justify-between px-3 py-2.5 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                      onClick={closeAllDrawers}
                    >
                      <span className="font-medium">{item}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Enhanced Mobile Drawer Component
  const MobileDrawer = ({ isOpen, onClose, children, title, size = 'default' }:any) => {
    const getDrawerWidth = () => {
      if (size === 'small') return 'max-w-sm';
      if (size === 'large') return 'max-w-lg';
      return 'max-w-md';
    };

    return (
      <>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300"
              onClick={onClose}
            />
            <div className={`fixed inset-y-0 right-0 w-full ${getDrawerWidth()} bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  aria-label={`Close ${title}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  if (!isClient) {
    return (
      <div className="h-32 lg:h-40 bg-white border-b border-gray-100">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-50"></div>
          <div className="h-12 bg-gray-25"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Navbar */}
      <nav 
        ref={navbarRef}
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-out backdrop-blur-lg ${
          isScrolled 
            ? 'bg-white/95 shadow-xl py-2' 
            : 'bg-white/98 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 flex-shrink-0"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center group flex-shrink-0" onClick={closeAllDrawers}>
              <div className="relative w-10 h-10 mr-3 group-hover:scale-110 transition-transform duration-200">
                <Image 
                  src="/assets/logo_Without_Text.png" 
                  alt="Plantomart Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-green-800 group-hover:text-green-600 transition-colors duration-200">
                plantomart
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="px-4 hidden lg:flex items-center space-x-2 xl:space-x-4 flex-1 justify-center">
              <DropdownMenu
                title="Vendors"
                items={navigationData.vendors}
                isActive={activeDropdown === 'Vendors'}
                onToggle={() => setActiveDropdown(activeDropdown === 'Vendors' ? null : 'Vendors')}
                type="vendors"
              />
              
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50 whitespace-nowrap"
                onClick={closeAllDrawers}
              >
                About
              </Link>
              
              <DropdownMenu
                title="Blog"
                items={navigationData.blog}
                isActive={activeDropdown === 'Blog'}
                onToggle={() => setActiveDropdown(activeDropdown === 'Blog' ? null : 'Blog')}
              />
              
              <DropdownMenu
                title="Company"
                items={navigationData.company}
                isActive={activeDropdown === 'Company'}
                onToggle={() => setActiveDropdown(activeDropdown === 'Company' ? null : 'Company')}
              />
              
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-green-600 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-green-50 whitespace-nowrap"
                onClick={closeAllDrawers}
              >
                Contact
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search plants, pots, kits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 xl:w-72 pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white hover:bg-white text-sm"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-3">
                {user ? (
                  <div className="relative">
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 group"
                      aria-label="User menu"
                    >
                      {user.avatar_url ? (
                        <div className="relative w-8 h-8 rounded-full border-2 border-green-200 overflow-hidden group-hover:border-green-300 transition-colors duration-200">
                          <Image 
                            src={user.avatar_url} 
                            alt="User profile" 
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors duration-200 max-w-24 truncate">
                        {user.full_name || 'User'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors duration-200" />
                    </button>

                    {/* User dropdown menu with smart positioning */}
                    {isUserMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
                            <p className="font-semibold text-gray-900">{user.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <Link 
                            href="/account" 
                            className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200 group"
                            onClick={closeAllDrawers}
                          >
                            <User className="w-4 h-4 mr-3 text-green-600" />
                            My Account
                            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Link>
                          <Link 
                            href="/orders" 
                            className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200 group"
                            onClick={closeAllDrawers}
                          >
                            <Package className="w-4 h-4 mr-3 text-green-600" />
                            My Orders
                            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Link>
                          <div className="border-t border-gray-100 mt-2 pt-2">
                            <button 
                              onClick={handleSignOut}
                              className="w-full flex items-center px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                            >
                              <LogOut className="mr-3 w-4 h-4" />
                              Sign out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSignInOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Sign In
                  </button>
                )}

                <button
                  onClick={toggleWishlist}
                  className="relative p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 group"
                  aria-label={`Wishlist (${wishlistItems.length} items)`}
                >
                  <Heart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {displayCount(wishlistItems.length)}
                    </span>
                  )}
                </button>

                <button
                  onClick={toggleCart}
                  className="relative p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 group"
                  aria-label={`Cart (${cartItems.length} items)`}
                >
                  <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-bounce">
                      {displayCount(cartItems.length)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <Link 
                href="tel:+918331801000" 
                className="p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                aria-label="Call us"
              >
                <Phone className="w-5 h-5" />
              </Link>

              {user ? (
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                  aria-label="User menu"
                >
                  {user.avatar_url ? (
                    <div className="relative w-5 h-5 rounded-full border border-green-200 overflow-hidden">
                      <Image 
                        src={user.avatar_url} 
                        alt="User profile"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => setIsSignInOpen(true)}
                  className="p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                  aria-label="Sign in"
                >
                  <User className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={toggleCart}
                className="relative p-3 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200"
                aria-label={`Cart (${cartItems.length} items)`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {displayCount(cartItems.length)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Secondary Category Navigation */}
      <div className={`fixed left-0 right-0 z-20 bg-white/95 backdrop-blur-lg border-b border-gray-100 transition-all duration-300 ${
        isScrolled ? 'top-16' : 'top-20'
      } lg:${isScrolled ? 'top-20' : 'top-24'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="hidden lg:flex items-center justify-center space-x-4 xl:space-x-8">
            <CategoryDropdown
              category="Plants"
              items={navigationData.categories.plants}
              icon={Leaf}
              isActive={activeCategoryDropdown === 'Plants'}
              onToggle={() => setActiveCategoryDropdown(activeCategoryDropdown === 'Plants' ? null : 'Plants')}
            />
            
            <CategoryDropdown
              category="Planters & Pots"
              items={navigationData.categories.planters}
              icon={Package}
              isActive={activeCategoryDropdown === 'Planters & Pots'}
              onToggle={() => setActiveCategoryDropdown(activeCategoryDropdown === 'Planters & Pots' ? null : 'Planters & Pots')}
            />
            
            <CategoryDropdown
              category="Gardening Kits"
              items={navigationData.categories.gardeningKits}
              icon={Shovel}
              isActive={activeCategoryDropdown === 'Gardening Kits'}
              onToggle={() => setActiveCategoryDropdown(activeCategoryDropdown === 'Gardening Kits' ? null : 'Gardening Kits')}
            />
          </div>
          
          {/* Enhanced Mobile Category Scroll */}
          <div className="lg:hidden flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
            <Link 
              href="/category/plants"
              className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-2xl whitespace-nowrap hover:from-green-200 hover:to-green-300 transition-all duration-200 shadow-md"
              onClick={closeAllDrawers}
            >
              <Leaf className="w-4 h-4" />
              <span className="font-medium">Plants</span>
            </Link>
            <Link 
              href="/category/planters"
              className="flex items-center space-x-2 px-5 py-3 text-gray-700 bg-white border border-gray-200 rounded-2xl whitespace-nowrap hover:bg-gray-50 transition-all duration-200 shadow-sm"
              onClick={closeAllDrawers}
            >
              <Package className="w-4 h-4" />
              <span className="font-medium">Planters</span>
            </Link>
            <Link 
              href="/category/gardening-kits"
              className="flex items-center space-x-2 px-5 py-3 text-gray-700 bg-white border border-gray-200 rounded-2xl whitespace-nowrap hover:bg-gray-50 transition-all duration-200 shadow-sm"
              onClick={closeAllDrawers}
            >
              <Shovel className="w-4 h-4" />
              <span className="font-medium">Kits</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Rest of your mobile components with enhanced styling */}
      {/* Enhanced Mobile Menu */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Menu"
        size="large"
      >
        <div className="p-6 space-y-6">
          {/* Enhanced User Section */}
          {user ? (
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-5 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-200 to-green-300 rounded-full flex items-center justify-center mr-4">
                  {user.avatar_url ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white">
                      <Image 
                        src={user.avatar_url} 
                        alt="User profile" 
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <User className="w-7 h-7 text-green-700" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-lg">{user.full_name || 'User'}</div>
                  <div className="text-sm text-green-700 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link 
                  href="/account"
                  className="flex-1 py-3 px-4 bg-white rounded-xl text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                  onClick={closeAllDrawers}
                >
                  My Account
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 py-3 px-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors duration-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-200">
              <div className="w-16 h-16 bg-gradient-to-r from-green-200 to-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-700" />
              </div>
              <div className="mb-4 text-gray-700 font-medium">Sign in to access your account</div>
              <button 
                onClick={() => {
                  setIsSignInOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Enhanced search bar */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search plants, pots, kits..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white hover:bg-white transition-all duration-200"
            />
            <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            {[
              { name: 'Home', href: '/', icon: Home },
              { name: 'Vendors', href: '/vendors', icon: Store },
              { name: 'About', href: '/about', icon: Building2 },
              { name: 'Blog', href: '/blog', icon: BookOpen },
              { name: 'Contact', href: '/contact', icon: MessageCircle },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={index}
                  href={item.href} 
                  className="flex items-center px-5 py-4 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-2xl transition-all duration-200 group"
                  onClick={closeAllDrawers}
                >
                  <Icon className="w-6 h-6 mr-4 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="font-semibold">{item.name}</span>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                toggleWishlist();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 flex items-center justify-center py-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl hover:from-pink-100 hover:to-red-100 transition-all duration-200 border border-pink-200"
            >
              <Heart className="w-5 h-5 mr-2 text-pink-600" />
              <span className="text-sm font-semibold text-pink-700">Wishlist ({wishlistItems.length})</span>
            </button>
            <Link 
              href="tel:+918331801000"
              className="flex-1 flex items-center justify-center py-4 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl text-green-700 hover:from-green-200 hover:to-green-300 transition-all duration-200 border border-green-300"
              onClick={closeAllDrawers}
            >
              <Phone className="w-5 h-5 mr-2" />
              <span className="text-sm font-semibold">Call Us</span>
            </Link>
          </div>

          {/* Category Links */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Shop Categories
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Plants', href: '/category/plants', icon: Leaf },
                { name: 'Planters & Pots', href: '/category/planters', icon: Package },
                { name: 'Gardening Kits', href: '/category/gardening-kits', icon: Shovel },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link 
                    key={index}
                    href={item.href}
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-xl transition-all duration-200 group"
                    onClick={closeAllDrawers}
                  >
                    <Icon className="w-5 h-5 mr-4 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">{item.name}</span>
                    <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-5 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Need Help?
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-green-700">
                <Phone className="w-5 h-5 mr-3" />
                <Link 
                  href="tel:+918331801000" 
                  className="text-lg font-semibold hover:text-green-800 transition-colors duration-200"
                  onClick={closeAllDrawers}
                >
                  +91 833 180 1000
                </Link>
              </div>
              <div className="text-sm text-green-600 font-medium ml-8">Available 9 AM - 6 PM, Mon-Sat</div>
            </div>
          </div>
        </div>
      </MobileDrawer>

      {/* Mobile Search */}
      <MobileDrawer
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        title="Search"
        size="small"
      >
        <div className="p-6">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search plants, planters, kits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white"
              autoFocus
            />
            <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="text-sm font-bold text-gray-700 mb-3">Popular searches:</div>
            <div className="flex flex-wrap gap-2">
              {['Peace Lily', 'Snake Plant', 'Ceramic Pots', 'Starter Kit', 'Succulents', 'Air Plants'].map((term, index) => (
                <button 
                  key={index}
                  onClick={() => setSearchQuery(term)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-green-100 hover:text-green-700 transition-colors duration-200 font-medium"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </MobileDrawer>

      {/* Cart and Wishlist Drawers */}
      <MobileDrawer
        isOpen={isCartOpen}
        onClose={toggleCart}
        title={`Shopping Cart (${cartItems.length})`}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 p-6">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Your cart is empty</h3>
                <p className="text-gray-600 mb-8 max-w-xs leading-relaxed">Discover our beautiful plants and add them to your cart</p>
                <button
                  onClick={closeAllDrawers}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="relative w-20 h-20 bg-gray-200 rounded-xl overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {item.tag && (
                        <span className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-br-xl rounded-tl-xl font-bold">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{item.title}</h4>
                      <p className="text-green-600 font-bold text-lg">{item.price}</p>
                      <div className="flex items-center space-x-3 mt-3">
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-lg font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors duration-200"
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-gray-900">Subtotal:</span>
                <span className="text-xl font-bold text-green-600">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout</p>
              <Link
                href="/checkout"
                className="block w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-bold text-center shadow-lg text-lg"
                onClick={closeAllDrawers}
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={closeAllDrawers}
                className="block w-full py-3 text-center text-green-600 hover:text-green-700 transition-colors text-sm font-semibold mt-3"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </MobileDrawer>

      <MobileDrawer
        isOpen={isWishlistOpen}
        onClose={toggleWishlist}
        title={`Wishlist (${wishlistItems.length})`}
      >
        <div className="p-6">
          {wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-red-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-8 max-w-xs leading-relaxed">Save your favorite plants for later</p>
              <button
                onClick={closeAllDrawers}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlistItems.map(item => (
                <div key={item.id} className="flex items-center space-x-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-5 border border-pink-200 shadow-sm">
                  <div className="relative w-20 h-20 bg-gray-200 rounded-xl overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{item.title}</h4>
                    <p className="text-green-600 font-bold text-lg mb-3">{item.price}</p>
                    <button 
                      onClick={() => addWishlistItemToCart(item)}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md transform hover:scale-105"
                    >
                      Add to Cart
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromWishlist(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-xl transition-colors duration-200"
                    aria-label={`Remove ${item.title} from wishlist`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileDrawer>

      {/* Sign In Modal */}
      {isSignInOpen && <SignIn isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />}

      {/* Enhanced Mobile User Menu */}
      {isUserMenuOpen && user && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsUserMenuOpen(false)}
          />
          <div className="fixed top-20 right-4 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 lg:hidden overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
              <p className="font-bold text-gray-900 text-lg">{user.full_name || 'User'}</p>
              <p className="text-sm text-green-700 truncate">{user.email}</p>
            </div>
            <Link 
              href="/account" 
              className="flex items-center px-6 py-4 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200 group"
              onClick={closeAllDrawers}
            >
              <User className="w-5 h-5 mr-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">My Account</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
            <Link 
              href="/orders" 
              className="flex items-center px-6 py-4 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200 group"
              onClick={closeAllDrawers}
            >
              <Package className="w-5 h-5 mr-3 text-green-600 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">My Orders</span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
            <div className="border-t border-gray-100 mt-2 pt-2">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center px-6 py-4 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="mr-3 w-5 h-5" />
                <span className="font-medium">Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dynamic Spacer */}
      <div className={`transition-all duration-300 ${
        isScrolled ? 'h-28 lg:h-32' : 'h-32 lg:h-40'
      }`}></div>

      {/* Enhanced CSS Styles */}
      <style jsx global>{`
        /* Scrollbar hiding */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Enhanced backdrop blur */
        .backdrop-blur-lg {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        
        /* Smooth transitions */
        * {
          transition-property: color, background-color, border-color, transform, opacity, box-shadow;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Enhanced animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% { 
            transform: scale(1.05); 
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
          }
        }
        
        .animate-float:hover {
          animation: float 2s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* Focus states for accessibility */
        .focus-ring:focus-visible {
          outline: 2px solid #10b981;
          outline-offset: 2px;
          border-radius: 8px;
        }
        
        /* Prevent layout shift */
        .layout-stable {
          contain: layout style paint;
        }
        
        /* Enhanced hover effects */
        .hover-lift {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        /* Responsive text sizing */
        @media (max-width: 768px) {
          .responsive-text {
            font-size: 0.875rem;
          }
        }
        
        /* Enhanced dropdown shadows */
        .dropdown-shadow {
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        
        /* Gradient text effects */
        .gradient-text {
          background: linear-gradient(135deg, #059669, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Mobile touch targets */
        @media (max-width: 768px) {
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Prevent zoom on input focus for iOS */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          select, textarea, input[type="text"], input[type="password"], 
          input[type="datetime"], input[type="datetime-local"], 
          input[type="date"], input[type="month"], input[type="time"], 
          input[type="week"], input[type="number"], input[type="email"], 
          input[type="url"], input[type="search"], input[type="tel"] {
            font-size: 16px !important;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .border-gray-200 {
            border-color: #000000;
          }
          .text-gray-700 {
            color: #000000;
          }
          .bg-white {
            background-color: #ffffff;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Print styles */
        @media print {
          .fixed, .sticky {
            position: static !important;
          }
          .shadow-xl, .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}

export default Navbar;