import { CartItem, WishlistItem } from '@/types/Cart';

const loadCartAndWishlist = (): {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
} => {
  let cartItems: CartItem[] = [];
  let wishlistItems: WishlistItem[] = [];

  if (typeof window !== 'undefined') {
    const storedCart = localStorage.getItem('plantomartCart');
    const storedWishlist = localStorage.getItem('plantomartWishlist');

    if (storedCart) {
      try {
        cartItems = JSON.parse(storedCart);
      } catch (e) {
        console.error("Failed to parse cart data:", e);
      }
    }

    if (storedWishlist) {
      try {
        wishlistItems = JSON.parse(storedWishlist);
      } catch (e) {
        console.error("Failed to parse wishlist data:", e);
      }
    }
  }

  return { cartItems, wishlistItems };
};

export default loadCartAndWishlist;
