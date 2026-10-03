// Prorrateo del precio de una promoción entre sus componentes reales, para que
// register_sale reciba precios unitarios de verdad (no "precio $0, promo aparte") y la
// suma de cada línea coincida con el precio de la promo. Es la misma cuenta que se usa
// tanto para combos fijos como para la bebida elegida en "bebida a elección": separado
// acá para poder testear la plata sin tener que montar todo el punto de venta.

export interface PromotionComponentInput {
  productId: string
  productName: string
  quantity: number
  price: number // precio de catálogo del producto, sin la promo
}

export interface ProratedComponent {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

/**
 * Reparte promoPrice entre los componentes, proporcional a lo que cada uno pesa en el
 * precio de catálogo sumado (normalTotal). Si normalTotal es 0 (productos sin precio
 * cargado), reparte el precio de la promo en partes iguales entre los componentes.
 *
 * Invariante que tienen que cumplir los tests: sum(unitPrice * quantity) ≈ promoPrice.
 */
export function prorateComponents(components: PromotionComponentInput[], promoPrice: number): ProratedComponent[] {
  const normalTotal = components.reduce((sum, c) => sum + c.price * c.quantity, 0)

  return components.map((c) => ({
    productId: c.productId,
    productName: c.productName,
    quantity: c.quantity,
    unitPrice:
      normalTotal > 0
        ? ((c.price * c.quantity) / normalTotal) * (promoPrice / c.quantity)
        : promoPrice / components.length / c.quantity,
  }))
}
