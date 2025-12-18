-- =====================================================
-- SCRIPT DE RESETEO COMPLETO
-- =====================================================
-- Este script BORRA TODA LA BASE DE DATOS y la recrea desde cero
-- ADVERTENCIA: Esto eliminará TODOS los datos existentes
-- =====================================================

-- Deshabilitar RLS temporalmente para hacer limpieza
ALTER TABLE IF EXISTS sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kioscos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chains DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kiosko_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_configs DISABLE ROW LEVEL SECURITY;

-- Eliminar todos los triggers
DROP TRIGGER IF EXISTS on_auth_user_created_create_chain ON auth.users;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_sale_items_updated_at ON sale_items;
DROP TRIGGER IF EXISTS update_kioscos_updated_at ON kioscos;
DROP TRIGGER IF EXISTS update_chains_updated_at ON chains;
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_kiosko_settings_updated_at ON kiosko_settings;

-- Eliminar todas las funciones
DROP FUNCTION IF EXISTS create_chain_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS user_owns_chain(UUID) CASCADE;
DROP FUNCTION IF EXISTS user_owns_kiosko(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_by_username_or_email(TEXT) CASCADE;

-- Eliminar todas las tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS notification_configs CASCADE;
DROP TABLE IF EXISTS kiosko_settings CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS kioscos CASCADE;
DROP TABLE IF EXISTS chains CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ejecuta este script (999) primero para limpiar TODO
-- 2. Luego ejecuta el script 000_complete_schema.sql
-- 3. Crea el usuario demo en Supabase Authentication:
--    - Email: demo@atlasone.com
--    - Password: demo123456
--    - Auto Confirm User: YES
-- 4. El trigger automático creará su cadena
-- =====================================================
