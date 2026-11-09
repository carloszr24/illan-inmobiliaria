export function extractProvinceFromLocation(location: string): string | null {
  const match = location.match(/\(([^)]+)\)\s*$/)
  return match ? match[1].trim() : null
}

export function getPropertyProvince(property: {
  province?: string | null
  location: string
}): string | null {
  return property.province?.trim() || extractProvinceFromLocation(property.location)
}

export function listProvincesFromProperties(
  properties: { province?: string | null; location: string }[]
): string[] {
  const provinces = new Set<string>()
  for (const property of properties) {
    const province = getPropertyProvince(property)
    if (province) provinces.add(province)
  }
  return Array.from(provinces).sort((a, b) => a.localeCompare(b, 'es'))
}
