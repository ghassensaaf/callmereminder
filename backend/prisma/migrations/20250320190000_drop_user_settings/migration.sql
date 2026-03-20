-- Drop legacy user_settings. If you still have Vapi keys only in this table,
-- run: node scripts/migrate-legacy-user-settings.mjs
-- (with a build that still had the table), then re-apply migrations.

DROP TABLE IF EXISTS "user_settings";
