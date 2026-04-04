-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('order_checkout');

-- CreateTable
CREATE TABLE "PhoneVerificationChallenge" (
    "id" TEXT NOT NULL,
    "customerProfileId" TEXT,
    "phone" TEXT NOT NULL,
    "customerName" TEXT,
    "purpose" "VerificationPurpose" NOT NULL DEFAULT 'order_checkout',
    "codeHash" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneVerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneVerificationChallenge_phone_purpose_idx" ON "PhoneVerificationChallenge"("phone", "purpose");

-- AddForeignKey
ALTER TABLE "PhoneVerificationChallenge" ADD CONSTRAINT "PhoneVerificationChallenge_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
