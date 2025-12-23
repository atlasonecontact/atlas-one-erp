-- ============================================
-- Script 999: DIAGNOSTICO RAPIDO - Estado de Demos
-- ============================================
-- Ejecuta este script para ver el estado de los demos
-- Compatible con Supabase SQL Editor
-- ============================================

-- 1. USUARIOS DEMO
SELECT 
  'USUARIOS DEMO' as seccion,
  COUNT(*) as total,
  STRING_AGG(email, ', ' ORDER BY email) as detalle
FROM auth.users 
WHERE email LIKE 'demo.%@atlasone.com';

-- 2. KIOSCOS
SELECT 
  'KIOSCOS' as seccion,
  COUNT(*) as total,
  STRING_AGG(name, ', ' ORDER BY name) as detalle
FROM kioscos k
WHERE owner_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
);

-- 3. ESTADO DETALLADO (IMPORTANTE)
SELECT 
  CASE 
    WHEN k.id IS NOT NULL AND (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) > 0 THEN 'OK'
    WHEN k.id IS NOT NULL THEN 'SIN_DATOS'
    ELSE 'SIN_KIOSKO'
  END as estado,
  u.email,
  u.id as user_id,
  k.id as kiosko_id,
  k.name as kiosko_nombre,
  (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) as productos,
  (SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id) as empleados,
  (SELECT COUNT(*) FROM sales WHERE kiosko_id = k.id) as ventas
FROM auth.users u
LEFT JOIN kioscos k ON k.owner_id = u.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;

-- 4. RESUMEN
SELECT 
  (SELECT COUNT(*) FROM auth.users WHERE email LIKE 'demo.%@atlasone.com') as usuarios_demo,
  (SELECT COUNT(*) FROM kioscos WHERE owner_id IN (SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com')) as kioscos_creados,
  (SELECT COUNT(*) FROM auth.users u WHERE email LIKE 'demo.%@atlasone.com' AND NOT EXISTS (SELECT 1 FROM kioscos WHERE owner_id = u.id)) as usuarios_sin_kiosko;
