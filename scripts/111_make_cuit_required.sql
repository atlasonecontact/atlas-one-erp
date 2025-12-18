-- Make CUIT required for kioscos and fix registration trigger

-- 1. Add CUIT column if it doesn't exist and make it required
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kioscos' AND column_name = 'cuit') THEN
    ALTER TABLE kioscos ADD COLUMN cuit TEXT;
  END IF;
END $$;

-- Update existing kioscos without CUIT to have a placeholder
UPDATE kioscos SET cuit = '00-00000000-0' WHERE cuit IS NULL OR cuit = '';

-- Make CUIT NOT NULL
ALTER TABLE kioscos ALTER COLUMN cuit SET NOT NULL;

-- 2. Fix the registration process - ensure chains are created automatically
CREATE OR REPLACE FUNCTION create_chain_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if chain already exists
  IF NOT EXISTS (SELECT 1 FROM chains WHERE owner_id = NEW.id) THEN
    -- Create chain with user's metadata or default name
    INSERT INTO chains (owner_id, name, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'chain_name',
        NEW.raw_user_meta_data->>'full_name' || '''s Chain',
        'Mi Cadena'
      ),
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_create_chain ON auth.users;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created_create_chain
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_chain_for_new_user();

-- 3. Create profile for existing users without profiles
INSERT INTO profiles (id, username, full_name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'owner',
  created_at,
  updated_at
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- 4. Create chains for existing users without chains
INSERT INTO chains (owner_id, name, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'chain_name', 'Mi Cadena'),
  NOW(),
  NOW()
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM chains WHERE chains.owner_id = auth.users.id)
ON CONFLICT DO NOTHING;
