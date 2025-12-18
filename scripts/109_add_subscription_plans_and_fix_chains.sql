-- Creating subscription_plans table and fixing chain creation issues

-- Drop and recreate subscription_plans table to fix structure
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Create subscription_plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  max_employees INTEGER NOT NULL DEFAULT 5,
  max_products INTEGER NOT NULL DEFAULT 100,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, price, max_employees, max_products, features)
VALUES
  ('Básico', 9.99, 3, 50, '["POS básico", "Inventario simple", "Reportes básicos"]'::jsonb),
  ('Profesional', 24.99, 10, 500, '["POS avanzado", "Inventario completo", "Reportes avanzados", "Múltiples empleados"]'::jsonb),
  ('Empresarial', 49.99, 50, 5000, '["Todo incluido", "Soporte prioritario", "Múltiples sucursales", "API acceso"]'::jsonb);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read plans
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- Make sure chains table has proper structure
ALTER TABLE chains ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE chains ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Create chain if chain_name is provided in metadata
  IF NEW.raw_user_meta_data->>'chain_name' IS NOT NULL THEN
    INSERT INTO chains (name, owner_id, created_at)
    VALUES (
      NEW.raw_user_meta_data->>'chain_name',
      NEW.id,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_handle_registration ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created_handle_registration
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Make CUIT and phone optional in kioscos
ALTER TABLE kioscos ALTER COLUMN cuit DROP NOT NULL;
ALTER TABLE kioscos ALTER COLUMN phone DROP NOT NULL;

-- Add subscription_plan_id to kioscos if not exists
ALTER TABLE kioscos ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id);

-- Set default plan for existing kioscos
UPDATE kioscos 
SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'Básico' LIMIT 1)
WHERE subscription_plan_id IS NULL;
