# Convención de `scripts/`

No hay CLI de Supabase ni credenciales de base de datos en este entorno. Todo cambio de
esquema es un archivo `.sql` numerado acá, que alguien copia y pega a mano en el SQL
Editor de Supabase. Esa es la razón de cada regla de acá abajo: están pensadas para que
un humano, pegando SQL a mano en una base de producción, no se vuele el pie.

## Reglas

1. **Numerar siempre hacia arriba.** El siguiente número es el más alto que exista en
   `scripts/` más uno (hoy: `227`, así que el próximo es `228`). Mirar
   `schema_migrations` (tabla, ver script 227) o el archivo con el número más alto en
   este directorio — lo que esté más actualizado.

2. **Todo script tiene que ser idempotente.** Usar siempre:
   - `CREATE TABLE IF NOT EXISTS`
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
   - `DROP POLICY IF EXISTS "..." ON tabla;` antes de cada `CREATE POLICY`
   - `CREATE OR REPLACE FUNCTION`
   - `INSERT ... ON CONFLICT DO NOTHING` (o `DO UPDATE` si corresponde)

   Esto importa en serio: si un script se corta a la mitad (por el problema de copiado
   que tuvimos varias veces esta sesión — líneas largas que se cortan al pegar), tiene
   que poder re-correrse entero sin romper nada ni duplicar nada.

3. **Encabezado obligatorio** en cada script nuevo:
   ```sql
   -- ============================================================================
   -- NNN_nombre_corto.sql
   -- Una o dos líneas: qué hace y, si corresponde a un bug real, cuál.
   -- Reversion: cómo se deshace en una frase (DROP TABLE x; / ALTER TABLE x
   --   DISABLE ROW LEVEL SECURITY; / etc.) Si no se puede explicar en una línea,
   --   el cambio probablemente es más riesgoso de lo que parece — pensarlo dos veces.
   -- ============================================================================
   ```

4. **Después de correrlo con éxito**, agregar una fila a `schema_migrations`:
   ```sql
   INSERT INTO schema_migrations (version, notes)
   VALUES ('228_lo_que_sea', 'una frase de qué hace')
   ON CONFLICT (version) DO NOTHING;
   ```
   Si algún día hace falta, `SELECT * FROM schema_migrations ORDER BY applied_at` dice
   qué está aplicado de verdad en producción, sin tener que adivinar por el chat.

5. **Copiar con el botón de "copiar" del bloque de código, nunca seleccionando a
   mano.** Varias veces esta sesión, copiar a mano (arrastrando el mouse) cortó texto
   en medio de una línea larga y generó errores de sintaxis rarísimos de diagnosticar.
   Si un script da un error de sintaxis en una línea que a simple vista está bien,
   sospechar primero del copiado, no de la lógica.

6. **Si el script tiene una sola sentencia muy larga, partirla en líneas cortas**
   (una cláusula `WHERE`/`AND`/`OR` por línea). El copiado a mano cortó más seguido
   líneas largas que varias líneas cortas.

7. **RLS: usar siempre el mismo patrón de "dueño o empleado activo"**, salvo que haya
   una razón real para algo distinto (como `price_surcharges`, donde sólo el dueño
   puede escribir — eso se documenta en el propio script):
   ```sql
   USING (
     kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
     OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
   )
   ```
   El modelo viejo con tabla `chains` (`kioscos.chain_id -> chains.owner_id`) está
   abandonado: no lo uses en código nuevo (fue la causa real de al menos un bug de
   producción — ver script 224).

## Qué NO hay todavía (y hay que tener en cuenta)

- No hay rollback automático: "deshacer" un script significa escribir y correr a mano
  el DROP/ALTER correspondiente. Para esta app (un solo desarrollador, cambios
  chicos) alcanza, pero si el equipo crece esto hay que formalizarlo con una
  herramienta de migraciones de verdad (ej. Supabase CLI + `supabase migration`).
- No hay ambiente de staging: todo cambio de esquema se prueba directo en producción.
  Por eso la regla de idempotencia no es opcional.
