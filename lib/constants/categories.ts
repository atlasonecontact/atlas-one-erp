// Única fuente de verdad para las categorías de producto. Se usa tanto en el
// alta/edición de productos como en los tabs de filtro del POS, para que un
// producto creado con una categoría siempre pueda encontrarse filtrando por
// esa misma categoría (antes eran dos listas hardcodeadas distintas).
export const PRODUCT_CATEGORIES = [
  "Bebidas",
  "Bebidas Alcohólicas",
  "Snacks",
  "Golosinas",
  "Cigarrillos",
  "Energizantes",
  "Lácteos",
  "Panadería",
  "Almacén",
  "Galletitas",
  "Helados",
  "Importados",
] as const
