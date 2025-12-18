-- Agregar columna username a employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Función para generar username único
CREATE OR REPLACE FUNCTION generate_unique_username(
  p_first_name TEXT,
  p_last_name TEXT,
  p_kiosko_id UUID
)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 1;
BEGIN
  -- Crear username base: nombre.apellido
  base_username := LOWER(
    REGEXP_REPLACE(
      UNACCENT(p_first_name || '.' || p_last_name),
      '[^a-z0-9.]',
      '',
      'g'
    )
  );
  
  final_username := base_username;
  
  -- Si ya existe, agregar número
  WHILE EXISTS (SELECT 1 FROM employees WHERE username = final_username) LOOP
    final_username := base_username || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Función actualizada para generar credenciales con username
CREATE OR REPLACE FUNCTION generate_employee_credentials(
  p_first_name TEXT,
  p_last_name TEXT,
  p_kiosko_id UUID
)
RETURNS TABLE (
  username TEXT,
  password TEXT,
  temp_email TEXT
) AS $$
DECLARE
  v_username TEXT;
  v_password TEXT;
  v_temp_email TEXT;
BEGIN
  -- Generar username único
  v_username := generate_unique_username(p_first_name, p_last_name, p_kiosko_id);
  
  -- Generar contraseña aleatoria de 12 caracteres
  v_password := array_to_string(
    ARRAY(
      SELECT chr((65 + round(random() * 25))::integer)
      FROM generate_series(1, 4)
    ), ''
  ) || array_to_string(
    ARRAY(
      SELECT chr((97 + round(random() * 25))::integer)
      FROM generate_series(1, 4)
    ), ''
  ) || array_to_string(
    ARRAY(
      SELECT chr((48 + round(random() * 9))::integer)
      FROM generate_series(1, 4)
    ), ''
  );
  
  -- Email temporal para Supabase (internamente)
  v_temp_email := v_username || '@atlasone.internal';
  
  RETURN QUERY SELECT v_username, v_password, v_temp_email;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar usuario por username o email en login
CREATE OR REPLACE FUNCTION find_user_by_username_or_email(
  p_identifier TEXT
)
RETURNS TABLE (
  user_email TEXT,
  is_employee BOOLEAN
) AS $$
BEGIN
  -- Primero verificar si es un username de empleado
  RETURN QUERY
  SELECT 
    e.auto_generated_email::TEXT,
    TRUE
  FROM employees e
  WHERE e.username = p_identifier
  LIMIT 1;
  
  -- Si no se encontró, asumir que es un email directo
  IF NOT FOUND THEN
    RETURN QUERY SELECT p_identifier::TEXT, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
