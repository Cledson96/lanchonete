CREATE TABLE "StoreBusinessHour" (
    "id" TEXT NOT NULL,
    "storeProfileId" TEXT NOT NULL,
    "weekday" TEXT NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreBusinessHour_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreBusinessHour_storeProfileId_weekday_key" ON "StoreBusinessHour"("storeProfileId", "weekday");
CREATE INDEX "StoreBusinessHour_weekday_idx" ON "StoreBusinessHour"("weekday");

ALTER TABLE "StoreBusinessHour"
ADD CONSTRAINT "StoreBusinessHour_storeProfileId_fkey"
FOREIGN KEY ("storeProfileId") REFERENCES "StoreProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
