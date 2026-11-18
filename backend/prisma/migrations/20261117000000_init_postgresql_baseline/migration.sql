-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('DRAFT', 'PENDING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED', 'PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "ReviewReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'OFFENSIVE', 'MISLEADING', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewReportStatus" AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ACADEMIC', 'REVIEWS', 'COMMUNITY', 'SYSTEM', 'SECURITY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(1024),
    "bio" TEXT,
    "university" VARCHAR(150),
    "university_id" TEXT,
    "course_id" TEXT,
    "semester" SMALLINT,
    "public_profile_enabled" BOOLEAN NOT NULL DEFAULT true,
    "show_academic_info" BOOLEAN NOT NULL DEFAULT true,
    "show_bio" BOOLEAN NOT NULL DEFAULT true,
    "show_contribution_stats" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "short_name" VARCHAR(50),
    "code" VARCHAR(50),
    "description" TEXT,
    "website" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "university_id" TEXT,
    "school_id" TEXT,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50),
    "degree_level" VARCHAR(50) DEFAULT 'Undergraduate',
    "semesters_count" SMALLINT NOT NULL DEFAULT 8,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "code" VARCHAR(50),
    "description" TEXT,
    "semester" SMALLINT NOT NULL,
    "credits" SMALLINT DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT,
    "content" TEXT,
    "file_name" VARCHAR(255),
    "storage_key" VARCHAR(512),
    "storage_provider" VARCHAR(50) NOT NULL DEFAULT 'local',
    "file_size" BIGINT,
    "mime_type" VARCHAR(100) DEFAULT 'application/pdf',
    "page_count" INTEGER,
    "university_id" TEXT,
    "school_id" TEXT,
    "course_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "topic_id" TEXT,
    "category_id" TEXT,
    "semester" SMALLINT,
    "academic_year" VARCHAR(20),
    "rejection_reason" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "status" "NoteStatus" NOT NULL DEFAULT 'PUBLISHED',
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'VISIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpful_votes" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_reports" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" "ReviewReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReviewReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reported_by_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" VARCHAR(64) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "download_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "download_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_view_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_view_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(60) NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'ACADEMIC',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "target_url" VARCHAR(500),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "event_key" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note_moderation" BOOLEAN NOT NULL DEFAULT true,
    "review_activity" BOOLEAN NOT NULL DEFAULT true,
    "helpful_votes" BOOLEAN NOT NULL DEFAULT true,
    "platform_announcements" BOOLEAN NOT NULL DEFAULT true,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "target_audience" VARCHAR(50) NOT NULL DEFAULT 'ALL',
    "target_url" VARCHAR(500),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    "description" VARCHAR(255),
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "page_configurations" (
    "id" TEXT NOT NULL,
    "page_key" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "draft_config" JSONB NOT NULL,
    "published_config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_themes" (
    "id" TEXT NOT NULL,
    "role_scope" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "draft_config" JSONB NOT NULL,
    "published_config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_configurations" (
    "id" TEXT NOT NULL,
    "role_scope" VARCHAR(50) NOT NULL,
    "draft_config" JSONB NOT NULL,
    "published_config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "navigation_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'CORE',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "section" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" JSONB NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration_versions" (
    "id" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_key" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_summary" VARCHAR(255),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuration_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "users_course_id_idx" ON "users"("course_id");

-- CreateIndex
CREATE INDEX "users_university_id_idx" ON "users"("university_id");

-- CreateIndex
CREATE UNIQUE INDEX "universities_name_key" ON "universities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "universities_slug_key" ON "universities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "universities_code_key" ON "universities"("code");

-- CreateIndex
CREATE INDEX "universities_is_active_idx" ON "universities"("is_active");

-- CreateIndex
CREATE INDEX "schools_university_id_idx" ON "schools"("university_id");

-- CreateIndex
CREATE INDEX "schools_is_active_idx" ON "schools"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "schools_university_id_slug_key" ON "schools"("university_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE INDEX "courses_is_active_idx" ON "courses"("is_active");

-- CreateIndex
CREATE INDEX "courses_university_id_idx" ON "courses"("university_id");

-- CreateIndex
CREATE INDEX "courses_school_id_idx" ON "courses"("school_id");

-- CreateIndex
CREATE INDEX "subjects_course_id_semester_idx" ON "subjects"("course_id", "semester");

-- CreateIndex
CREATE INDEX "subjects_slug_idx" ON "subjects"("slug");

-- CreateIndex
CREATE INDEX "subjects_is_active_idx" ON "subjects"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_course_id_slug_key" ON "subjects"("course_id", "slug");

-- CreateIndex
CREATE INDEX "topics_subject_id_idx" ON "topics"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_subject_id_slug_key" ON "topics"("subject_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "notes_storage_key_key" ON "notes"("storage_key");

-- CreateIndex
CREATE INDEX "notes_status_published_at_idx" ON "notes"("status", "published_at");

-- CreateIndex
CREATE INDEX "notes_status_download_count_idx" ON "notes"("status", "download_count");

-- CreateIndex
CREATE INDEX "notes_status_view_count_idx" ON "notes"("status", "view_count");

-- CreateIndex
CREATE INDEX "notes_status_course_id_idx" ON "notes"("status", "course_id");

-- CreateIndex
CREATE INDEX "notes_status_subject_id_idx" ON "notes"("status", "subject_id");

-- CreateIndex
CREATE INDEX "notes_status_semester_idx" ON "notes"("status", "semester");

-- CreateIndex
CREATE INDEX "notes_course_id_subject_id_idx" ON "notes"("course_id", "subject_id");

-- CreateIndex
CREATE INDEX "notes_subject_id_semester_idx" ON "notes"("subject_id", "semester");

-- CreateIndex
CREATE INDEX "notes_category_id_idx" ON "notes"("category_id");

-- CreateIndex
CREATE INDEX "notes_uploaded_by_id_status_idx" ON "notes"("uploaded_by_id", "status");

-- CreateIndex
CREATE INDEX "notes_university_id_idx" ON "notes"("university_id");

-- CreateIndex
CREATE INDEX "notes_school_id_idx" ON "notes"("school_id");

-- CreateIndex
CREATE INDEX "notes_slug_idx" ON "notes"("slug");

-- CreateIndex
CREATE INDEX "notes_title_idx" ON "notes"("title");

-- CreateIndex
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks"("user_id");

-- CreateIndex
CREATE INDEX "bookmarks_note_id_idx" ON "bookmarks"("note_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_note_id_key" ON "bookmarks"("user_id", "note_id");

-- CreateIndex
CREATE INDEX "reviews_note_id_idx" ON "reviews"("note_id");

-- CreateIndex
CREATE INDEX "reviews_note_id_status_created_at_idx" ON "reviews"("note_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "reviews_user_id_created_at_idx" ON "reviews"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_note_id_key" ON "reviews"("user_id", "note_id");

-- CreateIndex
CREATE INDEX "review_helpful_votes_review_id_idx" ON "review_helpful_votes"("review_id");

-- CreateIndex
CREATE INDEX "review_helpful_votes_user_id_idx" ON "review_helpful_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpful_votes_review_id_user_id_key" ON "review_helpful_votes"("review_id", "user_id");

-- CreateIndex
CREATE INDEX "review_reports_review_id_idx" ON "review_reports"("review_id");

-- CreateIndex
CREATE INDEX "review_reports_reporter_id_idx" ON "review_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "review_reports_status_idx" ON "review_reports"("status");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_note_id_idx" ON "reports"("note_id");

-- CreateIndex
CREATE INDEX "reports_reported_by_id_idx" ON "reports"("reported_by_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "refresh_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_idx" ON "refresh_sessions"("user_id");

-- CreateIndex
CREATE INDEX "refresh_sessions_expires_at_idx" ON "refresh_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_key" ON "email_verification_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expires_at_idx" ON "email_verification_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "study_collections_user_id_idx" ON "study_collections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_collections_user_id_name_key" ON "study_collections"("user_id", "name");

-- CreateIndex
CREATE INDEX "study_collection_items_collection_id_idx" ON "study_collection_items"("collection_id");

-- CreateIndex
CREATE INDEX "study_collection_items_note_id_idx" ON "study_collection_items"("note_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_collection_items_collection_id_note_id_key" ON "study_collection_items"("collection_id", "note_id");

-- CreateIndex
CREATE INDEX "download_history_user_id_downloaded_at_idx" ON "download_history"("user_id", "downloaded_at");

-- CreateIndex
CREATE INDEX "download_history_user_id_note_id_idx" ON "download_history"("user_id", "note_id");

-- CreateIndex
CREATE INDEX "download_history_note_id_idx" ON "download_history"("note_id");

-- CreateIndex
CREATE INDEX "note_view_history_user_id_viewed_at_idx" ON "note_view_history"("user_id", "viewed_at");

-- CreateIndex
CREATE INDEX "note_view_history_user_id_note_id_idx" ON "note_view_history"("user_id", "note_id");

-- CreateIndex
CREATE INDEX "note_view_history_note_id_idx" ON "note_view_history"("note_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_event_key_key" ON "notifications"("event_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_category_created_at_idx" ON "notifications"("user_id", "category", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "announcements_created_by_id_idx" ON "announcements"("created_by_id");

-- CreateIndex
CREATE INDEX "announcements_published_at_idx" ON "announcements"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "page_configurations_page_key_key" ON "page_configurations"("page_key");

-- CreateIndex
CREATE UNIQUE INDEX "platform_themes_role_scope_key" ON "platform_themes"("role_scope");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_configurations_role_scope_key" ON "navigation_configurations"("role_scope");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_category_is_enabled_idx" ON "feature_flags"("category", "is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "content_blocks_key_key" ON "content_blocks"("key");

-- CreateIndex
CREATE INDEX "content_blocks_section_is_published_idx" ON "content_blocks"("section", "is_published");

-- CreateIndex
CREATE INDEX "configuration_versions_entity_type_entity_key_version_idx" ON "configuration_versions"("entity_type", "entity_key", "version");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_collections" ADD CONSTRAINT "study_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_collection_items" ADD CONSTRAINT "study_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "study_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_collection_items" ADD CONSTRAINT "study_collection_items_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_history" ADD CONSTRAINT "download_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "download_history" ADD CONSTRAINT "download_history_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_view_history" ADD CONSTRAINT "note_view_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_view_history" ADD CONSTRAINT "note_view_history_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

