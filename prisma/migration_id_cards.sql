-- Check if columns exist and add only if they don't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'biometricId') THEN
    ALTER TABLE "students" ADD COLUMN "biometricId" VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'barcode') THEN
    ALTER TABLE "students" ADD COLUMN "barcode" VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'qrCodeData') THEN
    ALTER TABLE "students" ADD COLUMN "qrCodeData" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'cardStatus') THEN
    ALTER TABLE "students" ADD COLUMN "cardStatus" VARCHAR(20) DEFAULT 'NOT_ISSUED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'cardIssuedAt') THEN
    ALTER TABLE "students" ADD COLUMN "cardIssuedAt" TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'cardExpiresAt') THEN
    ALTER TABLE "students" ADD COLUMN "cardExpiresAt" DATE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'biometricId') THEN
    ALTER TABLE "teachers" ADD COLUMN "biometricId" VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'barcode') THEN
    ALTER TABLE "teachers" ADD COLUMN "barcode" VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'qrCodeData') THEN
    ALTER TABLE "teachers" ADD COLUMN "qrCodeData" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'cardStatus') THEN
    ALTER TABLE "teachers" ADD COLUMN "cardStatus" VARCHAR(20) DEFAULT 'NOT_ISSUED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'cardIssuedAt') THEN
    ALTER TABLE "teachers" ADD COLUMN "cardIssuedAt" TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'cardExpiresAt') THEN
    ALTER TABLE "teachers" ADD COLUMN "cardExpiresAt" DATE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'biometricId') THEN
    ALTER TABLE "staff" ADD COLUMN "biometricId" VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'barcode') THEN
    ALTER TABLE "staff" ADD COLUMN "barcode" VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'qrCodeData') THEN
    ALTER TABLE "staff" ADD COLUMN "qrCodeData" TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'cardStatus') THEN
    ALTER TABLE "staff" ADD COLUMN "cardStatus" VARCHAR(20) DEFAULT 'NOT_ISSUED';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'cardIssuedAt') THEN
    ALTER TABLE "staff" ADD COLUMN "cardIssuedAt" TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'cardExpiresAt') THEN
    ALTER TABLE "staff" ADD COLUMN "cardExpiresAt" DATE;
  END IF;
END $$;