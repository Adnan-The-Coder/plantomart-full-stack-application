ALTER TABLE `vendorProfiles` ADD `vendor_id` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `vendorProfiles_vendor_id_unique` ON `vendorProfiles` (`vendor_id`);