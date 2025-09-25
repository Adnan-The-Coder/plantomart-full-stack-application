// types/cart.ts
export type CartItem = {
  id: string;
  product_id?: string; // For Featured.tsx
  name?: string; // For original type
  title: string; // For Featured.tsx
  quantity: number;
  price?: number | string;
  numericPrice?: number; // For Navbar.tsx
  discountPrice?: number; // For Featured.tsx
  discountPercent?: number; // For Featured.tsx
  image?: string; // For original type
  image_gallery?: string[]; // For Featured.tsx
  slug?: string; // For Featured.tsx
  brand?: string; // For Featured.tsx
  category?: string; // For Featured.tsx
  featured?: boolean; // For Featured.tsx
  tag?: string; // For Navbar.tsx
};

export type WishlistItem = {
  id: string;
  product_id?: string; // For Featured.tsx
  name?: string; // For original type
  title?: string; // For Featured.tsx
  price?: number | string;
  numericPrice?: number; // For Navbar.tsx
  discountPrice?: number; // For Featured.tsx
  discountPercent?: number; // For Featured.tsx
  image?: string; // For original type
  image_gallery?: string[]; // For Featured.tsx
  slug?: string; // For Featured.tsx
  brand?: string; // For Featured.tsx
  category?: string; // For Featured.tsx
  featured?: boolean; // For Featured.tsx
  tag?: string; // For Navbar.tsx
};
