PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`productSeq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`content_description` text,
	`content_shipping_delivery` text,
	`category` text NOT NULL,
	`about_in_bullets` text NOT NULL,
	`image_gallery` text NOT NULL,
	`price` real NOT NULL,
	`brand` text NOT NULL,
	`vendor_id` text NOT NULL,
	`raiting` real NOT NULL,
	`review_numbers` integer NOT NULL,
	`reviews` text,
	`quantity` integer NOT NULL,
	`discount_percent` real,
	`discount_price` real,
	`variants` text,
	`variant_state` integer NOT NULL,
	`featured` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_products`("productSeq", "product_id", "slug", "title", "description", "content_description", "content_shipping_delivery", "category", "about_in_bullets", "image_gallery", "price", "brand", "vendor_id", "raiting", "review_numbers", "reviews", "quantity", "discount_percent", "discount_price", "variants", "variant_state", "featured", "created_at", "updated_at") SELECT "productSeq", "product_id", "slug", "title", "description", "content_description", "content_shipping_delivery", "category", "about_in_bullets", "image_gallery", "price", "brand", "vendor_id", "raiting", "review_numbers", "reviews", "quantity", "discount_percent", "discount_price", "variants", "variant_state", "featured", "created_at", "updated_at" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `products_product_id_unique` ON `products` (`product_id`);