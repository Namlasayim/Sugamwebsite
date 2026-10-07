export function formatNprPrice(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 'Price on request'
  }

  return `NPR ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(numericValue)}`
}

export function getPaintingPriceLabel(painting) {
  if (!painting) return 'Price on request'
  if (String(painting.status || '').toLowerCase() === 'sold') return 'Sold'
  return formatNprPrice(painting.price)
}
