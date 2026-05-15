export const ETHIOPIAN_REGIONS = [
  { name: 'Addis Ababa', code: 'AA', cities: ['Bole', 'Kirkos', 'Lideta', 'Yeka', 'Gulele', 'Kolfe', 'Nifas Silk', 'Addis Ketema', 'Arada'] },
  { name: 'Oromia', code: 'OR', cities: ['Adama', 'Jimma', 'Bishoftu', 'Ambo', 'Shashemene', 'Nekemte', 'Asella', 'Arsi'] },
  { name: 'Amhara', code: 'AM', cities: ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Markos', 'Debre Tabor', 'Lalibela'] },
  { name: 'Tigray', code: 'TI', cities: ['Mekelle', 'Adigrat', 'Axum', 'Shire', 'Adwa', 'Humera'] },
  { name: 'SNNPR', code: 'SN', cities: ['Hawassa', 'Arba Minch', 'Sodo', 'Dilla', 'Wolaita Sodo'] },
  { name: 'Sidama', code: 'SI', cities: ['Hawassa', 'Yirgalem', 'Aleta Wondo'] },
  { name: 'Harari', code: 'HA', cities: ['Harar'] },
  { name: 'Dire Dawa', code: 'DD', cities: ['Dire Dawa'] },
  { name: 'Benishangul-Gumuz', code: 'BG', cities: ['Assosa', 'Metekel'] },
  { name: 'Gambela', code: 'GA', cities: ['Gambela'] },
]

export const getAllCities = () => {
  return ETHIOPIAN_REGIONS.flatMap(region => region.cities)
}

export const getRegionByCity = (city) => {
  for (const region of ETHIOPIAN_REGIONS) {
    if (region.cities.includes(city)) {
      return region
    }
  }
  return null
}

export default ETHIOPIAN_REGIONS
