import type { Pharmacy, SearchSuggestion, AppNotification } from './store'
import { allPharmacies as _allPharmacies, getPharmaciesByLocation } from './data/pharmacies'

// Re-export to avoid large array issues
export const allPharmacies = _allPharmacies

// ===== MEDICINES =====
export const popularMedicines = [
  'Paracetamol 500mg', 'Paracetamol 650mg', 'Ibuprofen 400mg', 'Amoxicillin 500mg',
  'Azithromycin 500mg', 'Cetirizine 10mg', 'Omeprazole 20mg', 'Metformin 500mg',
  'Ciprofloxacin 500mg', 'Dolo 650', 'Crocin Advance', 'Combiflam',
  'Pantoprazole 40mg', 'Montelukast 10mg', 'Losartan 50mg', 'Amlodipine 5mg',
  'Atorvastatin 10mg', 'Cetirizine 5mg', 'Diclofenac 50mg', 'Ranitidine 150mg',
  'Aspirin 75mg', 'Vitamin D3 60000 IU', 'Vitamin B12 500mcg', 'Calcium + Vitamin D3',
  'ORS Powder', 'Albendazole 400mg', 'Domperidone 10mg', 'Drotaverine 40mg',
  'Levocetirizine 5mg', 'Fexofenadine 120mg', 'Montelukast + Levocetirizine',
  'Acetaminophen 500mg', 'Naproxen 250mg', 'Tramadol 50mg', 'Gabapentin 300mg',
  'Pregabalin 75mg', 'Amitriptyline 25mg', 'Clonazepam 0.5mg', 'Alprazolam 0.5mg',
  'Fluconazole 150mg', 'Acyclovir 400mg', 'Miconazole cream', 'Clotrimazole cream',
  'Cephalexin 500mg', 'Doxycycline 100mg', 'Metronidazole 400mg', 'Ofloxacin 200mg',
  'Rabeprazole 20mg', 'Esomeprazole 20mg', 'Sucralfate 1g', 'Ondansetron 4mg',
  'Glimepiride 2mg', 'Sitagliptin 50mg', 'Pioglitazone 15mg', 'Vildagliptin 50mg',
  'Telmisartan 40mg', 'Olmesartan 20mg', 'Valsartan 80mg', 'Enalapril 10mg',
  'Hydrochlorothiazide 25mg', 'Bisoprolol 5mg', 'Rosuvastatin 10mg',
  'Clopidogrel 75mg', 'Ecosprin 150mg', 'Atenolol 50mg', 'Nifedipine 10mg',
  'Ambroxol 30mg', 'Bromhexine 8mg', 'Salbutamol syrup', 'Budecort inhaler',
  'Cetrizine + Phenylephrine', 'Dextromethorphan', 'Benadryl', 'Sinarest',
  'D Cold Total', 'Vicks Action 500', 'Alex Cough', 'Honitus',
  'Supradyn', 'Becosules', 'Zincovit', 'Limcee', 'Shelcal 500',
  'Iron + Folic Acid', 'Folic Acid 5mg', 'Vitamin C 500mg', 'Zinc 50mg',
  'Soframycin', 'Betadine', 'Candid cream', 'Gentamicin eye drops',
  'Ciplox eye drops', 'Refresh Tears', 'Mupirocin ointment',
  'Misoprostol', 'Mifepristone', 'Levonorgestrel', 'Sildenafil 50mg',
  'Tadalafil 10mg', 'Dapoxetine 30mg', 'Finasteride 1mg',
]

export const medicineSuggestions: SearchSuggestion[] = popularMedicines.map((name, i) => {
  const parts = name.replace(/\d+(mg|IU|mcg|%)/g, '').trim().split(' ').filter(Boolean)
  const generic = parts[0] || ''
  const categories: Record<string, string> = {
    'Paracetamol': 'Pain Relief', 'Ibuprofen': 'Pain Relief', 'Aspirin': 'Pain Relief',
    'Diclofenac': 'Pain Relief', 'Naproxen': 'Pain Relief', 'Tramadol': 'Pain Relief',
    'Aceclofenac': 'Pain Relief', 'Nimesulide': 'Pain Relief', 'Mefenamic': 'Pain Relief',
    'Dolo': 'Pain Relief', 'Crocin': 'Pain Relief', 'Combiflam': 'Pain Relief',
    'Saridon': 'Pain Relief', 'Voveran': 'Pain Relief', 'Acetaminophen': 'Pain Relief',
    'Amoxicillin': 'Antibiotic', 'Azithromycin': 'Antibiotic', 'Ciprofloxacin': 'Antibiotic',
    'Doxycycline': 'Antibiotic', 'Metronidazole': 'Antibiotic', 'Cephalexin': 'Antibiotic',
    'Ofloxacin': 'Antibiotic', 'Levofloxacin': 'Antibiotic', 'Cefixime': 'Antibiotic',
    'Norfloxacin': 'Antibiotic', 'Augmentin': 'Antibiotic', 'Clarithromycin': 'Antibiotic',
    'Cloxacillin': 'Antibiotic', 'Ampicillin': 'Antibiotic', 'Gentamicin': 'Antibiotic',
    'Fluconazole': 'Antifungal', 'Acyclovir': 'Antiviral', 'Albendazole': 'Antiparasitic',
    'Cetirizine': 'Allergy', 'Levocetirizine': 'Allergy', 'Fexofenadine': 'Allergy',
    'Loratadine': 'Allergy', 'Desloratadine': 'Allergy', 'Montelukast': 'Respiratory',
    'Omeprazole': 'Gastric', 'Pantoprazole': 'Gastric', 'Rabeprazole': 'Gastric',
    'Lansoprazole': 'Gastric', 'Esomeprazole': 'Gastric', 'Ranitidine': 'Gastric',
    'Famotidine': 'Gastric', 'Sucralfate': 'Gastric', 'Domperidone': 'Gastric',
    'Ondansetron': 'Gastric', 'Metoclopramide': 'Gastric', 'Drotaverine': 'Antispasmodic',
    'Metformin': 'Diabetes', 'Glimepiride': 'Diabetes', 'Pioglitazone': 'Diabetes',
    'Sitagliptin': 'Diabetes', 'Vildagliptin': 'Diabetes', 'Insulin': 'Diabetes',
    'Amlodipine': 'Blood Pressure', 'Losartan': 'Blood Pressure', 'Telmisartan': 'Blood Pressure',
    'Olmesartan': 'Blood Pressure', 'Valsartan': 'Blood Pressure', 'Enalapril': 'Blood Pressure',
    'Ramipril': 'Blood Pressure', 'Atenolol': 'Blood Pressure', 'Bisoprolol': 'Blood Pressure',
    'Atorvastatin': 'Cholesterol', 'Rosuvastatin': 'Cholesterol', 'Clopidogrel': 'Cardiac',
    'Hydrochlorothiazide': 'Diuretic', 'Ecosprin': 'Cardiac',
    'Vitamin': 'Supplement', 'Iron': 'Supplement', 'Folic': 'Supplement',
    'Calcium': 'Supplement', 'Zinc': 'Supplement', 'Omega': 'Supplement',
    'Supradyn': 'Supplement', 'Becosules': 'Supplement', 'Shelcal': 'Supplement',
    'Limcee': 'Supplement', 'ORS': 'Rehydration',
    'Ambroxol': 'Cough', 'Bromhexine': 'Cough', 'Salbutamol': 'Respiratory',
    'Budecort': 'Respiratory', 'Montair': 'Respiratory', 'Seroflo': 'Respiratory',
    'Sinarest': 'Cold & Cough', 'D Cold': 'Cold & Cough', 'Vicks': 'Cold & Cough',
    'Benadryl': 'Cold & Cough', 'Alex': 'Cold & Cough', 'Honitus': 'Cold & Cough',
    'Soframycin': 'Skin', 'Betadine': 'Skin', 'Candid': 'Skin',
    'Clotrimazole': 'Skin', 'Miconazole': 'Skin', 'Mupirocin': 'Skin',
    'Ciplox': 'Eye/Ear', 'Refresh': 'Eye Care', 'Gentamicin': 'Eye/Ear',
    'Gabapentin': 'Neurological', 'Pregabalin': 'Neurological', 'Amitriptyline': 'Neurological',
    'Clonazepam': 'Neurological', 'Alprazolam': 'Neurological',
    'Sildenafil': 'Men\'s Health', 'Tadalafil': 'Men\'s Health', 'Dapoxetine': 'Men\'s Health',
    'Finasteride': 'Men\'s Health', 'Levonorgestrel': 'Contraceptive',
    'Misoprostol': 'Gynecology', 'Mifepristone': 'Gynecology',
  }
  let category = 'General'
  for (const [key, cat] of Object.entries(categories)) {
    if (name.toLowerCase().includes(key.toLowerCase())) { category = cat; break }
  }
  return { id: `med-${i}`, name, genericName: generic, category }
})

export const mockNotifications: AppNotification[] = [
  { id: 'n1', title: 'Medicine Available', message: 'Paracetamol 650mg is now available at Apollo Pharmacy near you at just ₹28.', type: 'availability', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'n2', title: 'Price Drop Alert', message: 'Dolo 650 price dropped to ₹27 at 1mg Pharmacy. Save 40% today!', type: 'price', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'n3', title: 'New Pharmacy Nearby', message: 'Rohindra Medical Stores has been added near your location in Bankura.', type: 'store', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: 'n4', title: 'Special Offer', message: 'Get 25% off on all vitamins and supplements at MedPlus this weekend.', type: 'offer', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
  { id: 'n5', title: 'App Update', message: 'Medicine Finder v2.0 is here! Now with comprehensive location data covering all Indian states and districts.', type: 'app', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'n6', title: 'Medicine Back in Stock', message: 'Azithromycin 500mg is back in stock at Netmeds Pharmacy.', type: 'availability', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
]

// ===== MEDICINE PRICING DATA =====
const medicinePriceBase: Record<string, { min: number; max: number; manufacturers: string[] }> = {
  'paracetamol': { min: 15, max: 45, manufacturers: ['Cipla Ltd', 'Sun Pharma', 'Micro Labs', 'Dr. Reddys', 'Mankind'] },
  'ibuprofen': { min: 20, max: 55, manufacturers: ['Dr. Reddys', 'Abbott', 'Mankind', 'Cipla Ltd'] },
  'amoxicillin': { min: 60, max: 150, manufacturers: ['Cipla Ltd', 'Alkem', 'Sun Pharma', 'Lupin'] },
  'azithromycin': { min: 70, max: 180, manufacturers: ['Zydus Cadila', 'Cipla Ltd', 'Alkem', 'Intas'] },
  'cetirizine': { min: 15, max: 40, manufacturers: ['Dr. Reddys', 'Mankind', 'Cipla Ltd', 'Abbott'] },
  'omeprazole': { min: 30, max: 85, manufacturers: ['Cipla Ltd', 'Dr. Reddys', 'Sun Pharma', 'Lupin'] },
  'pantoprazole': { min: 35, max: 90, manufacturers: ['Alkem', 'Sun Pharma', 'Zydus Cadila', 'Cipla Ltd'] },
  'metformin': { min: 12, max: 35, manufacturers: ['Sun Pharma', 'USV Pvt Ltd', 'Dr. Reddys', 'Mankind'] },
  'ciprofloxacin': { min: 25, max: 70, manufacturers: ['Cipla Ltd', 'Dr. Reddys', 'Mankind'] },
  'dolo': { min: 25, max: 48, manufacturers: ['Micro Labs'] },
  'crocin': { min: 22, max: 42, manufacturers: ['GSK'] },
  'combiflam': { min: 28, max: 55, manufacturers: ['Sanofi'] },
  'losartan': { min: 40, max: 110, manufacturers: ['Mankind', 'Sun Pharma', 'Cipla Ltd', 'Torrent'] },
  'amlodipine': { min: 25, max: 70, manufacturers: ['Mankind', 'Cipla Ltd', 'Sun Pharma', 'Dr. Reddys'] },
  'atorvastatin': { min: 35, max: 95, manufacturers: ['Mankind', 'Sun Pharma', 'Zydus Cadila', 'Ranbaxy'] },
  'montelukast': { min: 45, max: 120, manufacturers: ['Cipla Ltd', 'Sun Pharma', 'Dr. Reddys'] },
  'diclofenac': { min: 20, max: 55, manufacturers: ['Novartis', 'Mankind', 'Cipla Ltd'] },
  'dextromethorphan': { min: 30, max: 75, manufacturers: ['Mankind', 'Vicks', 'Abbott'] },
  'domperidone': { min: 15, max: 40, manufacturers: ['Mankind', 'Sun Pharma', 'Cipla Ltd'] },
  'aspirin': { min: 8, max: 25, manufacturers: ['Bayer', 'Micro Labs', 'USV Pvt Ltd'] },
  'vitamin': { min: 25, max: 80, manufacturers: ['Abbott', 'USV Pvt Ltd', 'Merck'] },
  'ORS': { min: 10, max: 30, manufacturers: ['Electral', 'WHO', 'FDC'] },
}

function getMedicinePrice(medName: string, pharmacyType: string): { price: number; originalPrice: number; inStock: boolean; manufacturer: string; discount: number } {
  const lower = medName.toLowerCase()
  let base: { min: number; max: number; manufacturers: string[] } | undefined
  for (const [key, val] of Object.entries(medicinePriceBase)) {
    if (lower.includes(key)) { base = val; break }
  }
  if (!base) {
    base = { min: 20, max: 80, manufacturers: ['Cipla Ltd', 'Sun Pharma', 'Dr. Reddys', 'Mankind'] }
  }
  const chainDiscount = pharmacyType === 'chain' ? 0.85 : 1.0
  const basePrice = base.min + Math.random() * (base.max - base.min)
  const price = Math.round(basePrice * chainDiscount)
  const originalPrice = Math.round(price / (0.7 + Math.random() * 0.25))
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100)
  const manufacturer = base.manufacturers[Math.floor(Math.random() * base.manufacturers.length)]
  return { price, originalPrice, inStock: Math.random() > 0.15, manufacturer, discount }
}

function pharmacyToAppPharmacy(pd: { id: string; name: string; address: string; city: string; district: string; state: string; country: string; phone: string; rating: number; reviewCount: number; distance: number; travelTime: string; isOpen: boolean; workingHours: string; lat: number; lng: number; type: string; chain?: string }, searchQuery: string): Pharmacy | null {
  const lower = searchQuery.toLowerCase()
  const matchingMeds: Pharmacy['medicines'] = []
  for (const [key] of Object.keys(medicinePriceBase)) {
    if (lower.includes(key) || key.includes(lower.split(' ')[0]?.toLowerCase() || '')) {
      const priceData = getMedicinePrice(key, pd.type)
      const strength = searchQuery.match(/\d+\s*(mg|IU|mcg)/i)?.[0] || '500mg'
      matchingMeds.push({
        id: `${pd.id}-${key}`,
        name: searchQuery,
        genericName: key.charAt(0).toUpperCase() + key.slice(1),
        price: priceData.price, originalPrice: priceData.originalPrice,
        inStock: priceData.inStock, discount: priceData.discount, manufacturer: priceData.manufacturer,
      })
      break
    }
  }
  if (matchingMeds.length === 0) return null
  return {
    id: pd.id, name: pd.name, address: pd.address, phone: pd.phone,
    rating: pd.rating, reviewCount: pd.reviewCount, distance: pd.distance,
    travelTime: pd.travelTime, isOpen: pd.isOpen, workingHours: pd.workingHours,
    lat: pd.lat, lng: pd.lng, medicines: matchingMeds,
  }
}

export function searchMedicines(query: string, country?: string, state?: string, city?: string): Pharmacy[] {
  if (!query.trim()) return []
  const normalizedQuery = query.toLowerCase().trim()
  let pharmacies
  if (country && state && city) {
    pharmacies = getPharmaciesByLocation(country, state, city)
  } else {
    pharmacies = [..._allPharmacies].sort(() => Math.random() - 0.5).slice(0, 20)
  }
  const results: Pharmacy[] = []
  for (const pd of pharmacies) {
    const result = pharmacyToAppPharmacy(pd, query)
    if (result) results.push(result)
  }
  return results
}

export function getPriceComparison(medicineName: string, country?: string, state?: string, city?: string) {
  const results = searchMedicines(medicineName, country, state, city)
  if (results.length === 0) return null
  const inStockResults = results.filter(r => r.medicines.some(m => m.inStock))
  if (inStockResults.length === 0) return null
  const allPrices = inStockResults.map(r => Math.min(...r.medicines.filter(m => m.inStock).map(m => m.price)))
  const bestPharmacy = inStockResults.reduce((best, current) => {
    const bestPrice = Math.min(...best.medicines.filter(m => m.inStock).map(m => m.price))
    const currentPrice = Math.min(...current.medicines.filter(m => m.inStock).map(m => m.price))
    return currentPrice < bestPrice ? current : best
  })
  return {
    minPrice: Math.min(...allPrices), maxPrice: Math.max(...allPrices),
    avgPrice: Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length),
    bestDeal: bestPharmacy, results: inStockResults,
  }
}

export function getMedicineSuggestions(query: string): SearchSuggestion[] {
  if (!query.trim()) return []
  const normalized = query.toLowerCase()
  return medicineSuggestions.filter(
    s => s.name.toLowerCase().includes(normalized) || s.genericName.toLowerCase().includes(normalized) || s.category.toLowerCase().includes(normalized)
  ).slice(0, 10)
}

export function getNearbyPharmacies(country: string, state: string, city: string, limit = 10): typeof _allPharmacies[0][] {
  return getPharmaciesByLocation(country, state, city).slice(0, limit)
}

// Re-export comprehensive countries list built from location data files
export { countries } from './data/countries'