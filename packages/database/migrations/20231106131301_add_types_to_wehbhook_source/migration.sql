-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "WehbhookSource" ADD VALUE 'make';
ALTER TYPE "WehbhookSource" ADD VALUE 'n8n';

-- 1. Rename the existing ENUM type.
ALTER TYPE "WehbhookSource" RENAME TO "TempWebhookSource";

-- 2. Create the new ENUM type.
CREATE TYPE "WebhookSource" AS ENUM ('user', 'zapier', 'make', 'n8n');

-- 3. Remove the default.
ALTER TABLE "Webhook" ALTER COLUMN "source" DROP DEFAULT;

-- 4. Change the column type using the USING clause for casting.
ALTER TABLE "Webhook"
ALTER COLUMN "source" TYPE "WebhookSource" USING "source"::text::"WebhookSource";

-- 5. Add the default back.
ALTER TABLE "Webhook" ALTER COLUMN "source" SET DEFAULT 'user';

-- Optionally, if you want to drop the old ENUM type after verifying everything works:
DROP TYPE "TempWebhookSource";
