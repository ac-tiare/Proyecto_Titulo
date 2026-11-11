CREATE TYPE "ResourceCategory" AS ENUM (
    'WELLBEING',
    'WARNING_SIGNS',
    'SELF_CARE',
    'HELP_AND_PREVENTION'
);

CREATE TABLE "resources" (
    "id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "links" JSONB NOT NULL DEFAULT '[]',
    "category" "ResourceCategory" NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_notification_preferences" (
    "user_id" UUID NOT NULL,
    "emotional_check_ins" BOOLEAN NOT NULL DEFAULT false,
    "preventive_wellbeing" BOOLEAN NOT NULL DEFAULT false,
    "safety_plan_updates" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "resources_category_title_idx" ON "resources"("category", "title");

ALTER TABLE "user_notification_preferences"
ADD CONSTRAINT "user_notification_preferences_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
