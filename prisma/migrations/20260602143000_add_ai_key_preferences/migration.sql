ALTER TABLE "User"
ADD COLUMN "defaultAiProvider" "AiProvider";

ALTER TABLE "UserAiKey"
ADD COLUMN "modelName" TEXT,
ADD COLUMN "validatedAt" TIMESTAMP(3),
ADD COLUMN "lastUsedAt" TIMESTAMP(3),
ADD COLUMN "lastValidationError" TEXT;
