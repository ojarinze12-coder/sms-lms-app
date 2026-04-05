-- Add payment gateway configuration fields to tenant_settings
ALTER TABLE tenant_settings 
ADD COLUMN IF NOT EXISTS "paymentGatewayEnabled" Boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "paymentGateway" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "paymentGatewaySecretKey" TEXT,
ADD COLUMN IF NOT EXISTS "paymentGatewayPublicKey" TEXT,
ADD COLUMN IF NOT EXISTS "paymentGatewayWebhookSecret" TEXT,
ADD COLUMN IF NOT EXISTS "remitaEnabled" Boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "remitaMerchantId" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "remitaApiKey" TEXT,
ADD COLUMN IF NOT EXISTS "remitaServiceTypeId" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "remitaEnvironment" VARCHAR(10);

-- Create index for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenantId);