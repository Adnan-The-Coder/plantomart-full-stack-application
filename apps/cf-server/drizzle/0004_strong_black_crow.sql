PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_blogs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`blog_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`author_name` text NOT NULL,
	`author_id` text,
	`featured_image` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_blogs`("id", "blog_id", "title", "slug", "excerpt", "content", "category", "tags", "author_name", "author_id", "featured_image", "is_featured", "is_published", "views", "seo_title", "seo_description", "created_at", "updated_at") SELECT "id", "blog_id", "title", "slug", "excerpt", "content", "category", "tags", "author_name", "author_id", "featured_image", "is_featured", "is_published", "views", "seo_title", "seo_description", "created_at", "updated_at" FROM `blogs`;--> statement-breakpoint
DROP TABLE `blogs`;--> statement-breakpoint
ALTER TABLE `__new_blogs` RENAME TO `blogs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `blogs_blog_id_unique` ON `blogs` (`blog_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `blogs_slug_unique` ON `blogs` (`slug`);