import { CartItem, WishlistItem } from "@/types/Cart";

// Helper function to safely store data in localStorage with size limit handling
export function safeLocalStorage(key: string, data: any): void {
  try {
    // Convert data to string
    const jsonData = JSON.stringify(data);
    
    // Check size (5MB is typical localStorage limit, we'll stay well under that)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB limit
    
    if (jsonData.length > MAX_SIZE) {
      console.warn(`Data for ${key} exceeds safe size limit. Trimming data.`);
      
      // For cart/wishlist, we can limit the number of items
      if (Array.isArray(data) && data.length > 10) {
        // Keep only the 10 most recent items
        const trimmedData = data.slice(-10);
        localStorage.setItem(key, JSON.stringify(trimmedData));
        return;
      }
      
      // If we can't trim by items, we'll have to skip saving
      console.error(`Unable to save ${key} data: too large for localStorage`);
      return;
    }
    
    localStorage.setItem(key, jsonData);
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
    // Attempt to clear the storage if it might be a quota error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Try to remove the item that caused the error
      localStorage.removeItem(key);
      console.warn(`Removed ${key} due to storage quota issues`);
    }
  }
}

// Helper to get item ID regardless of structure
function getItemId(item: CartItem | WishlistItem): string {
  return item.id || item.product_id || '';
}

// ---- CART ----

export function updateCartQuantity(cartItems: CartItem[], id: string, newQuantity: number): CartItem[] {
  if (newQuantity <= 0) return cartItems;

  const updatedCart = cartItems.map(item =>
    getItemId(item) === id ? { ...item, quantity: newQuantity } : item
  );

  safeLocalStorage("plantomartCart", updatedCart);
  window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updatedCart }));

  return updatedCart;
}

export function removeFromCart(cartItems: CartItem[], id: string): CartItem[] {
  const updatedCart = cartItems.filter(item => getItemId(item) !== id);

  safeLocalStorage("plantomartCart", updatedCart);
  window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updatedCart }));

  return updatedCart;
}

export function addWishlistItemToCart(cartItems: CartItem[], product: Omit<CartItem, 'quantity'>): CartItem[] {
  // Handle both id and product_id fields
  const productId = getItemId(product as CartItem);
  const existingItemIndex = cartItems.findIndex(item => getItemId(item) === productId);

  let updatedCart;
  if (existingItemIndex >= 0) {
    updatedCart = cartItems.map(item =>
      getItemId(item) === productId ? { ...item, quantity: item.quantity + 1 } : item
    );
  } else {
    const newItem: CartItem = { ...product, quantity: 1 };
    // Ensure id is set if only product_id exists
    if (!newItem.id && newItem.product_id) {
      newItem.id = newItem.product_id;
    }
    updatedCart = [...cartItems, newItem];
  }

  safeLocalStorage("plantomartCart", updatedCart);
  window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updatedCart }));

  return updatedCart;
}

// ---- WISHLIST ----

export function addToWishlist(wishlistItems: WishlistItem[], product: Omit<WishlistItem, 'quantity'>): WishlistItem[] {
  // Handle both id and product_id fields
  const productId = getItemId(product as WishlistItem);
  const existingItemIndex = wishlistItems.findIndex(item => getItemId(item) === productId);

  // If item already exists in wishlist, don't add it again
  if (existingItemIndex >= 0) {
    return wishlistItems;
  }
  
  const newItem: WishlistItem = { ...product };
  // Ensure id is set if only product_id exists
  if (!newItem.id && newItem.product_id) {
    newItem.id = newItem.product_id;
  }
  const updatedWishlist = [...wishlistItems, newItem];

  safeLocalStorage("plantomartWishlist", updatedWishlist);
  window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: updatedWishlist }));

  return updatedWishlist;
}

export function removeFromWishlist(wishlistItems: WishlistItem[], id: string): WishlistItem[] {
  // Handle both id and product_id fields
  const updatedWishlist = wishlistItems.filter(item => getItemId(item) !== id);
  
  safeLocalStorage("plantomartWishlist", updatedWishlist);
  window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: updatedWishlist }));
  
  return updatedWishlist;
}
