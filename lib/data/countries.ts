// Build comprehensive countries list from location data files
import { indiaSouthWest } from './locations-india-sw'
import { indiaNorthEast } from './locations-india-ne'
import { worldCountries } from './locations-world'

interface CountryData {
  name: string
  code: string
  flag: string
  states: { name: string; cities: string[] }[]
}

// Flatten district-level data to state-level (all cities in one flat array per state)
function flattenIndiaStates(
  data: { name: string; districts: { name: string; cities: string[] }[] }[]
): { name: string; cities: string[] }[] {
  return data.map((state) => {
    const citySet = new Set<string>()
    state.districts.forEach((district) => {
      district.cities.forEach((city) => citySet.add(city))
    })
    return {
      name: state.name,
      cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
    }
  })
}

// Merge all India states, deduplicating by state name
function buildIndiaStates(): { name: string; cities: string[] }[] {
  const sw = flattenIndiaStates(indiaSouthWest)
  const ne = flattenIndiaStates(indiaNorthEast)

  const stateMap = new Map<string, Set<string>>()

  const addStates = (states: { name: string; cities: string[] }[]) => {
    for (const s of states) {
      const key = s.name
      if (!stateMap.has(key)) stateMap.set(key, new Set())
      const existing = stateMap.get(key)!
      for (const city of s.cities) existing.add(city)
    }
  }

  addStates(sw)
  addStates(ne)

  return Array.from(stateMap.entries())
    .map(([name, citySet]) => ({
      name,
      cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Build full countries list: India first, then rest of world (alphabetically)
export const countries: CountryData[] = [
  {
    name: 'India',
    code: 'IN',
    flag: '\u{1F1EE}\u{1F1F3}',
    states: buildIndiaStates(),
  },
  ...worldCountries
    .filter((c) => c.name !== 'India') // avoid duplicate if world file has India
    .sort((a, b) => a.name.localeCompare(b.name)),
]