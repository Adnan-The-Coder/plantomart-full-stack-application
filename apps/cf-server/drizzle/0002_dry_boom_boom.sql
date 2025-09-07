CREATE TABLE `productVariantGroups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` text NOT NULL,
	`parent_product_id` text NOT NULL,
	`group_name` text NOT NULL,
	`group_type` text NOT NULL,
	`is_required` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`parent_product_id`) REFERENCES `products`(`product_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productVariantGroups_group_id_unique` ON `productVariantGroups` (`group_id`);--> statement-breakpoint
CREATE TABLE `productVariants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`variant_id` text NOT NULL,
	`parent_product_id` text NOT NULL,
	`slug` text NOT NULL,
	`variant_name` text NOT NULL,
	`variant_type` text NOT NULL,
	`price` real NOT NULL,
	`quantity` integer NOT NULL,
	`discount_percent` real,
	`discount_price` real,
	`image_gallery` text,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`parent_product_id`) REFERENCES `products`(`product_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productVariants_variant_id_unique` ON `productVariants` (`variant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `productVariants_slug_unique` ON `productVariants` (`slug`);