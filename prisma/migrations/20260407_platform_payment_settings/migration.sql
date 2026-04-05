-- Create platform_settings table for PCC payment gateway configuration
CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR(20) PRIMARY KEY DEFAULT 'platform',
  payment_gateway VARCHAR(20) DEFAULT 'PAYSTACK',
  paystack_secret_key TEXT,
  paystack_public_key VARCHAR(255),
  flutterwave_secret_key TEXT,
  flutterwave_public_key VARCHAR(255),
  remita_merchant_id VARCHAR(100),
  remita_api_key TEXT,
  remita_service_type_id VARCHAR(50),
  created_at TIMESTAMPTZ(6) DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Insert default platform settings if not exists
INSERT INTO platform_settings (id, payment_gateway, created_at, updated_at)
VALUES ('platform', 'PAYSTACK', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;