import { NextRequest, NextResponse } from 'next/server'
import { searchMedicines, getPriceComparison, getMedicineSuggestions, getNearbyPharmacies, allPharmacies } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'search'
  const sort = searchParams.get('sort') || 'lowest-price'
  const availableNow = searchParams.get('available') === 'true'
  const openOnly = searchParams.get('open') === 'true'
  const maxDistance = searchParams.get('maxDistance') ? Number(searchParams.get('maxDistance')) : null
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
  const country = searchParams.get('country') || undefined
  const state = searchParams.get('state') || undefined
  const city = searchParams.get('city') || undefined

  if (type === 'suggestions') {
    const suggestions = getMedicineSuggestions(query)
    return NextResponse.json({ suggestions })
  }

  if (type === 'nearby') {
    const loc = { country: country || 'India', state: state || 'West Bengal', city: city || 'Bankura' }
    let pharmacies = getNearbyPharmacies(loc.country, loc.state, loc.city, 20)
    if (openOnly) pharmacies = pharmacies.filter(p => p.isOpen)
    if (maxDistance) pharmacies = pharmacies.filter(p => p.distance <= maxDistance)
    return NextResponse.json({ pharmacies })
  }

  if (type === 'price-compare') {
    const comparison = getPriceComparison(query, country, state, city)
    if (!comparison) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }
    return NextResponse.json(comparison)
  }

  // Full search
  let results = searchMedicines(query, country, state, city)

  // Apply filters
  if (availableNow) {
    results = results.map(p => ({
      ...p,
      medicines: p.medicines.filter(m => m.inStock),
    })).filter(p => p.medicines.length > 0)
  }

  if (openOnly) {
    results = results.filter(p => p.isOpen)
  }

  if (maxDistance) {
    results = results.filter(p => p.distance <= maxDistance)
  }

  if (maxPrice) {
    results = results.map(p => ({
      ...p,
      medicines: p.medicines.filter(m => m.price <= maxPrice),
    })).filter(p => p.medicines.length > 0)
  }

  // Apply sorting
  switch (sort) {
    case 'lowest-price':
      results.sort((a, b) => Math.min(...a.medicines.map(m => m.price)) - Math.min(...b.medicines.map(m => m.price)))
      break
    case 'nearest':
      results.sort((a, b) => a.distance - b.distance)
      break
    case 'highest-rating':
      results.sort((a, b) => b.rating - a.rating)
      break
  }

  // Get price comparison for the search
  const priceComparison = getPriceComparison(query, country, state, city)

  return NextResponse.json({
    results,
    priceComparison,
    totalStores: results.length,
  })
}