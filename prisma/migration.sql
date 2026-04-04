-- Create transport_subscriptions table
CREATE TABLE IF NOT EXISTS "transport_subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL,
  "routeId" UUID NOT NULL,
  "vehicleId" UUID,
  "academicYearId" UUID,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "paymentStatus" VARCHAR(20) DEFAULT 'PENDING',
  "paymentMethod" VARCHAR(20),
  "transactionRef" VARCHAR(100),
  "paidAt" TIMESTAMPTZ,
  "isActive" BOOLEAN DEFAULT true,
  "tenantId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transport_subscriptions_studentId_fkey'
  ) THEN
    ALTER TABLE "transport_subscriptions" 
    ADD CONSTRAINT "transport_subscriptions_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_transport_subscriptions_student" ON "transport_subscriptions"("studentId");
CREATE INDEX IF NOT EXISTS "idx_transport_subscriptions_route" ON "transport_subscriptions"("routeId");
CREATE INDEX IF NOT EXISTS "idx_transport_subscriptions_tenant_status" ON "transport_subscriptions"("tenantId", "paymentStatus");