ALTER TABLE "sessions" RENAME COLUMN "token_hash" TO "access_token_hash";
ALTER TABLE "sessions" RENAME COLUMN "expires_at" TO "access_expires_at";

ALTER TABLE "sessions"
ADD COLUMN "refresh_token_hash" CHAR(64),
ADD COLUMN "refresh_expires_at" TIMESTAMPTZ(3);

UPDATE "sessions"
SET "revoked_at" = COALESCE("revoked_at", CURRENT_TIMESTAMP);

ALTER INDEX "sessions_token_hash_key" RENAME TO "sessions_access_token_hash_key";
ALTER INDEX "sessions_user_id_expires_at_idx" RENAME TO "sessions_user_id_access_expires_at_idx";
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");
CREATE INDEX "sessions_user_id_refresh_expires_at_idx" ON "sessions"("user_id", "refresh_expires_at");
