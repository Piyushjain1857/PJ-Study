-- CreateIndex
CREATE INDEX `notes_status_download_count_idx` ON `notes`(`status`, `download_count`);

-- CreateIndex
CREATE INDEX `notes_status_view_count_idx` ON `notes`(`status`, `view_count`);
