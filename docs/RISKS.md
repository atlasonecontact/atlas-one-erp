# Partes frágiles del proyecto — qué las rompe y cómo nos enteramos

Este documento es el resultado de revisar el proyecto después de una sesión larga de
bugs en cadena (RLS rota en `products`/`promotions`, un bug de TDZ en `ventas/page.tsx`,
precios de promociones mal calculados, productos duplicados por código de barras, stock
que no aparecía en el punto de venta). La pregunta que organiza todo esto es: **¿qué
cambio, en qué archivo, puede romper cinco cosas que no tenían nada que ver?**

## 1. RLS en Supabase: hay políticas de 3 épocas distintas conviviendo

**Qué encontramos:** `products` tenía políticas de seguridad de scripts `101`, `106` y
`110` — todas vigentes al mismo tiempo, todas basadas en un modelo de "cadenas"
(`kioscos.chain_id -> chains.owner_id`) que el resto de la app **nunca usa** (todo el
código actual compara `kioscos.owner_id = auth.uid()` directo). Si un kiosko no tenía
ese `chain_id` enlazado, crear un producto nuevo fallaba con un error de RLS sin
ninguna explicación. Ver `scripts/224_fix_products_rls.sql`.

**Por qué es frágil:** Postgres combina varias políticas RLS para la misma tabla con
`OR` — así que una política vieja y rota puede convivir años sin que nadie note el
problema, hasta que justo el caso que esa política bloquea aparece en producción.

**Qué lo rompe:** agregar una tabla nueva y copiar/pegar una política RLS vieja de
memoria (en vez de usar el patrón actual de `scripts/README.md`). También: tocar
`kioscos` o `employees` sin revisar si hay políticas de `101`/`106`/`110` que todavía
las referencien.

**Cómo nos enteraríamos (hoy):** recién cuando un usuario real choca con el error, igual
que pasó con `products`. **No hay ningún test ni chequeo automático de políticas RLS**
— es el hueco más grande que queda (ver sección 7).

**Tablas que todavía podrían tener el mismo problema** (no confirmado, no tocado esta
sesión): `sales`, `employees`, `kioscos` — tienen políticas del mismo período en su
historial de scripts. `sales` probablemente está a salvo porque los inserts pasan por
`register_sale` (`SECURITY DEFINER`, no por RLS directo), pero no está verificado.

## 2. `app/dashboard/ventas/page.tsx` — ~1450 líneas, un solo componente

**Qué tiene adentro:** todo el punto de venta — carga de productos, promociones,
recargo por horario, carrito, caja, pago, impresión de ticket, escaneo de código de
barras, sincronización offline. Prácticamente todas las `const` del componente dependen
de las de arriba.

**Por qué es frágil:** ya hubo un bug de TDZ (temporal dead zone) esta sesión — una
`const` nueva (`displayProducts`) se usó dentro de un `useCallback` (`handleBarcodeScanned`)
declarado **antes** en el archivo, y React tiraba `ReferenceError` en cada render. El
orden de las `const` en un componente de 1450 líneas no es algo que salte a la vista en
un diff.

**Qué lo rompe:** agregar una variable derivada (`useMemo`/`useState`) y usarla en una
función declarada más arriba en el archivo. **Regla práctica:** toda nueva `const`
derivada de `products` va justo después de donde se define `products`/`displayProducts`,
nunca al final del archivo "porque total ya está todo declarado arriba" — no es así
dentro de un mismo render.

**Qué lo cubre hoy:** `lib/pos/promotion-pricing.ts` y la función `isSurchargeActiveNow`
(en `components/pos/surcharge-modal.tsx`) ya están separadas del componente y tienen
tests. El resto de la lógica de plata del carrito (`buildSaleItems`,
`applyCartToProducts`) sigue adentro del componente, sin tests — es la extracción más
valiosa que falta (ver sección 7).

## 3. `app/dashboard/productos/page.tsx` — ~1100 líneas, mismo problema

Catálogo, CSV, ajuste de precios, duplicados por código de barras, desactivar/reactivar.
La función `findDuplicateByBarcode` ya se extrajo y tiene tests (`lib/products/duplicates.ts`);
el resto (guardado, CSV, ajuste de precios) sigue inline.

## 4. `products.barcode` no tiene restricción UNIQUE en la base

**Qué encontramos:** nada en la base impide que dos productos tengan el mismo código de
barras — fue exactamente el bug real de esta sesión (dos "Coca-Cola" con el mismo
código). Se arregló en la capa de aplicación (`findDuplicateByBarcode`, usado en
`handleSave` antes de insertar), pero la base en sí sigue permitiendo duplicados si
algún otro camino de escritura (CSV, una función nueva, un acceso directo a Supabase)
no pasa por esa misma validación.

**Qué lo rompe:** cualquier INSERT a `products` que no pase por
`app/dashboard/productos/page.tsx::handleSave` (por ejemplo, `handleCSVImport`, que
sigue sin este chequeo — matchea por `sku`, no por `barcode`).

**Recomendación a futuro** (no aplicada, para no tocar más de lo pedido): un índice
único parcial `CREATE UNIQUE INDEX ON products (kiosko_id, barcode) WHERE barcode IS NOT
NULL AND barcode <> ''` dejaría esto imposible de verdad, no sólo validado en un lugar.

## 5. `is_active` en `products`: filtrado inconsistente entre pantallas

**Qué encontramos:** `products.is_active` ahora se usa en el punto de venta (para que un
producto desactivado no se pueda vender) pero no se filtra en absolutamente todas las
pantallas que listan productos (CSV import, por ejemplo, no lo toca en absoluto).

**Qué lo rompe:** agregar una pantalla nueva que liste `products` y asumir que
`is_active=false` ya está filtrado en alguna capa común — no existe esa capa común, cada
pantalla decide por su cuenta.

## 6. `loadProducts` en el punto de venta: quién filtra qué, y por qué

Esta sesión se encontraron y arreglaron dos bugs seguidos en la misma función
(`app/dashboard/ventas/page.tsx::loadProducts`):
1. Filtraba `stock_quantity > 0` en la consulta SQL — un producto nuevo sin stock
   cargado no existía ni para la grilla ni para el escáner.
2. No filtraba `is_active` — hasta que se agregó la función de desactivar productos.

**Por qué importa dejarlo escrito:** la próxima persona (o la próxima sesión) que toque
esta función va a tener la tentación de "optimizar" agregando un filtro en la consulta
SQL. Cualquier filtro ahí tiene que pensarse con cuidado: todo lo que se filtra en la
consulta **desaparece** tanto de la grilla como del escáner de código de barras al
mismo tiempo, sin aviso.

## 7. Lo que falta (next steps honestos, no hechos hoy)

- **Tests de integración contra una base real.** Todo lo de hoy son tests de funciones
  puras (cálculo de precios, franja horaria, duplicados) — rápidos y confiables, pero
  no prueban RLS, triggers, ni `register_sale`. Para probar RLS de verdad hace falta un
  proyecto de Supabase de prueba (o `supabase start` local) — no se armó hoy porque es
  una pieza de infraestructura grande en sí misma.
- **Extraer `buildSaleItems`/`applyCartToProducts`** de `ventas/page.tsx` a un módulo
  con tests, con el mismo criterio que `promotion-pricing.ts`.
- **Backlog de lint** (508 warnings, ver `eslint.config.mjs`): en su mayoría
  `@typescript-eslint/no-explicit-any` (214) y las reglas nuevas de
  `eslint-plugin-react-hooks` v7 orientadas al React Compiler (que esta app no usa).
  No es código roto, es deuda a pagar de a poco.
- **Backlog de tipos** (22 errores, ver `.ci/typecheck-baseline.txt`): todos
  preexistentes a esta sesión, en su mayoría `components/mobile/*` y un par de páginas
  de dashboard. `next.config.mjs` tiene `ignoreBuildErrors: true`, así que hoy no
  bloquean el deploy — el trinquete de CI (`.ci/check-typecheck-baseline.mjs`) evita que
  crezcan, pero no los arregla.
- **CI no bloquea Vercel todavía.** `.github/workflows/ci.yml` corre en cada push y
  deja un check en verde/rojo en GitHub, pero Vercel sigue deployando aunque ese check
  esté en rojo — no hay "branch protection" configurada (eso requiere acceso de admin
  al repo en GitHub, que no se tocó sin pedirlo primero). Para que de verdad bloquee:
  GitHub → repo → Settings → Branches → Branch protection rule para `main` → marcar
  "Require status checks to pass" → elegir el check `lint, typecheck, test, build`.
