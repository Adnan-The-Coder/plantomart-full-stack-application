import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { desc, sql } from "drizzle-orm";

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  email: text("email").notNull().unique(),

  subscribed: integer("subscribed", { mode: "boolean" })
    .notNull()
    .default(true),

  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const contactUs = sqliteTable("contactus", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(),

  email: text("email").notNull(),

  subject: text("subject").notNull(), // or remove `.notNull()` if optional

  description: text("description").notNull(),

  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const userProfiles = sqliteTable("userProfiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  uuid: text("uuid").notNull().unique(), // Composite primary key component // comes in 

  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  full_name: text("full_name").notNull(), // comes in
  avatar_url: text("avatar_url"), // comes in
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),

  updated_at: text("updated_at"),

  email_notifications: text("email_notifications"),

  bio: text("bio"),

  user_login_info: text("user_login_info"), // SQLite doesn't support JSON natively, store as TEXT

  email: text("email").notNull(), // comes in

  reviews: text("reviews"), // Store as JSON string
});

export const products = sqliteTable("products", {
  productSeq: integer("productSeq").primaryKey({ autoIncrement: true }),

  product_id: text("product_id").unique().notNull(),

  slug: text("slug").notNull(),

  title: text("title").notNull(),

  description: text("description").notNull(),

  content_description: text("content_description"),

  content_shipping_delivery: text("content_shipping_delivery"),

  category: text("category").notNull(),

  about_in_bullets: text("about_in_bullets", { mode: "json" }).notNull(),

  image_gallery: text("image_gallery", { mode: "json" }).notNull(),

  price: real("price").notNull(),

  brand: text("brand").notNull(),

  vendorID: text("vendor_id").notNull(),

  raiting: real("raiting").notNull(),

  reviewNumbers: integer("review_numbers").notNull(),

  reviews: text("reviews", { mode: "json" }), // optional

  quantity: integer("quantity").notNull(),

  discountPercent: real("discount_percent"), // optional

  discountPrice: real("discount_price"), // optional

  variants: text("variants", { mode: "json" }), // optional

  variantState: integer("variant_state", { mode: "boolean" }).notNull(),

  featured: integer("featured", { mode: "boolean" }).notNull(),

  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
});

// NEW: Product Variants Table
export const productVariants = sqliteTable("productVariants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  variant_id: text("variant_id").unique().notNull(),
  
  parent_product_id: text("parent_product_id")
    .notNull()
    .references(() => products.product_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  
  slug: text("slug").notNull().unique(), // Unique slug for each variant
  
  variant_name: text("variant_name").notNull(), // e.g., "Small", "Medium", "Large"
  
  variant_type: text("variant_type").notNull(), // e.g., "size", "color", "material"
  
  price: real("price").notNull(), // Individual price for this variant
  
  quantity: integer("quantity").notNull(), // Individual stock for this variant
  
  discount_percent: real("discount_percent"), // Optional discount for this variant
  
  discount_price: real("discount_price"), // Calculated discount price
  
  image_gallery: text("image_gallery", { mode: "json" }), // Variant-specific images
  
  description: text("description"), // Variant-specific description
  
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  
  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
});

// NEW: Product Variant Groups Table (for organizing variants)
export const productVariantGroups = sqliteTable("productVariantGroups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  group_id: text("group_id").unique().notNull(),
  
  parent_product_id: text("parent_product_id")
    .notNull()
    .references(() => products.product_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  
  group_name: text("group_name").notNull(), // e.g., "Size", "Color"
  
  group_type: text("group_type").notNull(), // e.g., "size", "color"
  
  is_required: integer("is_required", { mode: "boolean" }).notNull().default(true),
  
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  
  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
});

export const vendorProfiles = sqliteTable("vendorProfiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Foreign key to userProfiles.uuid
  user_uuid: text("user_uuid")
    .notNull()
    .references(() => userProfiles.uuid, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .unique(),

  vendor_id: text("vendor_id")
    .notNull()
    .unique(),

  slug: text("slug").notNull().unique(), // For SEO-friendly vendor URLs
  name: text("name").notNull(),          // Shop/Vendor name
  description: text("description"),

  banner_image: text("banner_image"),
  logo: text("logo"),
  image_gallery: text("image_gallery", { mode: "json" }), // JSON array of image URLs

  rating: real("rating").default(0), // Store average rating as a float

  about_us: text("about_us"),
  features: text("features", { mode: "json" }), // JSON array of features

  // Legal Information
  business_name: text("business_name"),
  business_address: text("business_address"),
  business_registration_number: text("business_registration_number"),
  gstin_number: text("gstin_number"),
  legal_structure: text("legal_structure"),
  pan_number: text("pan_number"), // ✅ New: PAN Number

  // Contact Info
  contact_person_name: text("contact_person_name"),
  contact_email: text("contact_email"),
  contact_phone: text("contact_phone"),

  // Bank Info (consider encrypting these in production)
  bank_account_number: text("bank_account_number"),
  bank_name: text("bank_name"),
  ifsc_code: text("ifsc_code"),

  // Fees & Tax Preferences
  shipping_fee_mode: text("shipping_fee_mode").default("vendor"), 
  /**
   * Enum-like: 
   * "vendor" — vendor bears the shipping cost
   * "customer" — customer pays delivery charges
   */

  gst_rate: real("gst_rate").default(0), 
  /**
   * % tax as float (e.g., 5.0, 12.0, 18.0) — used when no tax code is selected.
   * Since PlantoMart sells plant-based goods, 5% or 12% are typically used for fertilizers/plants, 
   * but this keeps things flexible.
   */

  // Policies
  return_policy: text("return_policy"),
  shipping_policy: text("shipping_policy"),
  privacy_policy: text("privacy_policy"),
  seller_terms: text("seller_terms"),

  // Compliance
  business_license: text("business_license"),
  identity_verification: text("identity_verification"),

  // Status
  is_verified: integer("is_verified").default(0),
  status: text("status").default("pending"), // pending, approved, rejected, suspended

  // Timestamps
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const vendorProducts = sqliteTable("vendorProducts", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  product_id: text("product_id")
    .notNull()
    .references(() => products.product_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  vendor_id: text("vendor_id")
    .notNull()
    .references(() => vendorProfiles.user_uuid, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});


export const blogs = sqliteTable("blogs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Unique blog identifier (similar to vendor_id pattern)
  blogId: text("blog_id").notNull().unique(),

  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),

  excerpt: text("excerpt"), // Short preview text or summary
  content: text("content").notNull(), // Markdown, HTML, or serialized rich text

  category: text("category").notNull(), // e.g., "green-living", "plant-care-101"
  tags: text("tags"), // JSON string for array of tags (e.g., ["indoor", "care"])

  authorName: text("author_name").notNull(),
  authorId: text("author_id"), // User UUID or email - matches controller validation

  featuredImage: text("featured_image"), // URL or path
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false).notNull(),
  isPublished: integer("is_published", { mode: "boolean" }).default(false).notNull(),

  views: integer("views").default(0).notNull(),

  // SEO fields
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),

  // Timestamps - using text to match controller's ISO string format
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});


export const productCombinations = sqliteTable("productCombinations", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Unique identifier for this combination
  combination_id: text("combination_id").notNull().unique(),

  // The main product for which this combination is shown
  parent_product_id: text("parent_product_id")
    .notNull()
    .references(() => products.product_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),

  // Optional display label (e.g., "Frequently Bought Together")
  combination_name: text("combination_name").notNull(),

  // Optional internal or user-visible description
  description: text("description"),

  // JSON array of child product references: [{ product_id: "xxx", quantity: 1 }, ...]
  child_products: text("child_products", { mode: "json" }).notNull(),

  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
});


export const productReviews = sqliteTable("productReviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  review_id: text("review_id").notNull().unique(),
  product_id: text("product_id")
    .notNull()
    .references(() => products.product_id, {  
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  user_uuid: text("user_uuid")
    .notNull()
    .references(() => userProfiles.uuid, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  likes: integer("rating").notNull().default(0), 
  liked_by: text("liked_by", { mode: "json" }).notNull().default("[]"), // JSON array of user_uuids who liked
  disliked_by: text("disliked_by", { mode: "json" }).notNull().default("[]"), // JSON array of user_uuids who disliked
  dislikes: integer("dislikes").notNull().default(0), 
  comments: text("title").notNull(),
  replies: text("replies", { mode: "json" }).notNull().default("[]"), // JSON array of { user_uuid, comment, created_at }
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});