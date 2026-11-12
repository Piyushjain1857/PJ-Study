-- AlterTable
ALTER TABLE `notes` ADD COLUMN `academic_year` VARCHAR(20) NULL,
    ADD COLUMN `category_id` VARCHAR(191) NULL,
    ADD COLUMN `content` LONGTEXT NULL,
    ADD COLUMN `rejection_reason` TEXT NULL,
    ADD COLUMN `semester` SMALLINT NULL,
    ADD COLUMN `slug` VARCHAR(255) NULL,
    MODIFY `file_name` VARCHAR(255) NULL,
    MODIFY `storage_key` VARCHAR(512) NULL,
    MODIFY `file_size` BIGINT NULL,
    MODIFY `mime_type` VARCHAR(100) NULL DEFAULT 'application/pdf',
    MODIFY `status` ENUM('DRAFT', 'PENDING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `notes_subject_id_semester_idx` ON `notes`(`subject_id`, `semester`);

-- CreateIndex
CREATE INDEX `notes_category_id_idx` ON `notes`(`category_id`);

-- CreateIndex
CREATE INDEX `notes_uploaded_by_id_status_idx` ON `notes`(`uploaded_by_id`, `status`);

-- CreateIndex
CREATE INDEX `notes_slug_idx` ON `notes`(`slug`);

-- AddForeignKey
ALTER TABLE `notes` ADD CONSTRAINT `notes_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
