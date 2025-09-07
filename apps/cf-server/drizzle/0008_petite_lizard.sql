CREATE TABLE `productReviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`review_id` text NOT NULL,
	`product_id` text NOT NULL,
	`user_uuid` text NOT NULL,
	`rating` integer DEFAULT 0 NOT NULL,
	`liked_by` text DEFAULT '[]' NOT NULL,
	`disliked_by` text DEFAULT '[]' NOT NULL,
	`dislikes` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`replies` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`product_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_uuid`) REFERENCES `userProfiles`(`uuid`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productReviews_review_id_unique` ON `productReviews` (`review_id`);