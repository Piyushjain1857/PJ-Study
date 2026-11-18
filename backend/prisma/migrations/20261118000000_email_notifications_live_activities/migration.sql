-- AlterTable notification_preferences with email preference toggles
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "email_security_alerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "email_new_notes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "email_announcements" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "email_live_activity" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "email_account_updates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "email_weekly_digest" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable email_delivery_logs
CREATE TABLE IF NOT EXISTS "email_delivery_logs" (
    "id" TEXT NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "template_key" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'SENT',
    "error_message" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "user_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable notification_templates
CREATE TABLE IF NOT EXISTS "notification_templates" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "html_body" TEXT NOT NULL,
    "text_body" TEXT,
    "description" VARCHAR(255),
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable live_activities
CREATE TABLE IF NOT EXISTS "live_activities" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "actor_id" TEXT,
    "actor_name" VARCHAR(150),
    "actor_role" VARCHAR(50),
    "target_id" TEXT,
    "target_type" VARCHAR(50),
    "metadata" JSONB,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_key_key" ON "notification_templates"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_delivery_logs_status_idx" ON "email_delivery_logs"("status");
CREATE INDEX IF NOT EXISTS "email_delivery_logs_recipient_idx" ON "email_delivery_logs"("recipient");
CREATE INDEX IF NOT EXISTS "email_delivery_logs_template_key_idx" ON "email_delivery_logs"("template_key");
CREATE INDEX IF NOT EXISTS "email_delivery_logs_created_at_idx" ON "email_delivery_logs"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "live_activities_type_created_at_idx" ON "live_activities"("type", "created_at");
CREATE INDEX IF NOT EXISTS "live_activities_actor_id_idx" ON "live_activities"("actor_id");
CREATE INDEX IF NOT EXISTS "live_activities_is_public_created_at_idx" ON "live_activities"("is_public", "created_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'email_delivery_logs_user_id_fkey'
    ) THEN
        ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
