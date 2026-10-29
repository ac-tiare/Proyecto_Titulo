CREATE TYPE "Mood" AS ENUM ('VERY_GOOD', 'GOOD', 'NEUTRAL', 'BAD', 'VERY_BAD');
CREATE TYPE "Emotion" AS ENUM ('SADNESS', 'ANXIETY', 'FEAR', 'ANGER', 'LONELINESS', 'CALM', 'HOPE', 'OTHER');
CREATE TYPE "PlanItemType" AS ENUM ('WARNING_SIGN', 'COPING_ACTION', 'SAFE_PLACE');
CREATE TYPE "SessionClient" AS ENUM ('WEB', 'NATIVE');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100),
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "client" "SessionClient" NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emotional_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mood" "Mood" NOT NULL,
    "note" VARCHAR(500),
    "other_emotion" VARCHAR(500),
    "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "emotional_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emotional_record_emotions" (
    "record_id" UUID NOT NULL,
    "emotion" "Emotion" NOT NULL,
    CONSTRAINT "emotional_record_emotions_pkey" PRIMARY KEY ("record_id", "emotion")
);

CREATE TABLE "safety_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "safety_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "safety_plan_items" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "type" "PlanItemType" NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "safety_plan_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trusted_contacts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(24) NOT NULL,
    "relationship" VARCHAR(100),
    "details" VARCHAR(300),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "trusted_contacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");
CREATE INDEX "emotional_records_user_id_recorded_at_idx" ON "emotional_records"("user_id", "recorded_at" DESC);
CREATE UNIQUE INDEX "safety_plans_user_id_key" ON "safety_plans"("user_id");
CREATE INDEX "safety_plan_items_plan_id_type_position_idx" ON "safety_plan_items"("plan_id", "type", "position");
CREATE INDEX "trusted_contacts_user_id_created_at_idx" ON "trusted_contacts"("user_id", "created_at");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emotional_records" ADD CONSTRAINT "emotional_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emotional_record_emotions" ADD CONSTRAINT "emotional_record_emotions_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "emotional_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_plans" ADD CONSTRAINT "safety_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "safety_plan_items" ADD CONSTRAINT "safety_plan_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "safety_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
