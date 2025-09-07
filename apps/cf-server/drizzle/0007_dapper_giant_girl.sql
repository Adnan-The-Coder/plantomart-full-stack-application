CREATE TABLE `productCombinations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`combination_id` text NOT NULL,
	`parent_product_id` text NOT NULL,
	`combination_name` text NOT NULL,
	`description` text,
	`child_products` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`parent_product_id`) REFERENCES `products`(`product_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productCombinations_combination_id_unique` ON `productCombinations` (`combination_id`);