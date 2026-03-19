-- AlterTable
ALTER TABLE "reminder_executions" ADD COLUMN IF NOT EXISTS "call_details" JSONB;
