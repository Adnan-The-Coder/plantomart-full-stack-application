CREATE TABLE `contactus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`description` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`subscribed` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `products` (
	`productSeq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
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
CREATE UNIQUE INDEX `products_product_id_unique` ON `products` (`product_id`);--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uuid` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`full_name` text NOT NULL,
	`avatar_url` text,
	`phone` text,
	`address` text,
	`city` text,
	`state` text,
	`pincode` text,
	`updated_at` text,
	`email_notifications` text,
	`bio` text,
	`user_login_info` text,
	`email` text NOT NULL,
	`reviews` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userProfiles_uuid_unique` ON `userProfiles` (`uuid`);--> statement-breakpoint
CREATE TABLE `vendorProducts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` text NOT NULL,
	`vendor_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendorProfiles`(`user_uuid`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vendorProfiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_uuid` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`banner_image` text,
	`logo` text,
	`image_gallery` text,
	`rating` real DEFAULT 0,
	`about_us` text,
	`features` text,
	`business_name` text,
	`business_address` text,
	`business_registration_number` text,
	`gstin_number` text,
	`legal_structure` text,
	`pan_number` text,
	`contact_person_name` text,
	`contact_email` text,
	`contact_phone` text,
	`bank_account_number` text,
	`bank_name` text,
	`ifsc_code` text,
	`shipping_fee_mode` text DEFAULT 'vendor',
	`gst_rate` real DEFAULT 0,
	`return_policy` text,
	`shipping_policy` text,
	`privacy_policy` text,
	`seller_terms` text,
	`business_license` text,
	`identity_verification` text,
	`is_verified` integer DEFAULT 0,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_uuid`) REFERENCES `userProfiles`(`uuid`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendorProfiles_user_uuid_unique` ON `vendorProfiles` (`user_uuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendorProfiles_slug_unique` ON `vendorProfiles` (`slug`);