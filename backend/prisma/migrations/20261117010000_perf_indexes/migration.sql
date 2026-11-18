-- CreateIndex
CREATE INDEX IF NOT EXISTS "notes_status_created_at_idx" ON "notes"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notes_status_course_id_semester_idx" ON "notes"("status", "course_id", "semester");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notes_status_subject_id_created_at_idx" ON "notes"("status", "subject_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookmarks_user_id_created_at_idx" ON "bookmarks"("user_id", "created_at" DESC);
