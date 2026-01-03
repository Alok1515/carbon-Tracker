// Standard emission factors in grams CO₂ (approx per usage context)
// Intended for awareness and educational purposes only
export const emissionFactors: Record<string, number> = {
  car: 120,
  truck: 900,
  bus: 1000,
  motorcycle: 90,
  "air conditioner": 1500,
  laptop: 50,
  refrigerator: 1200,
  factory: 3000,
  "plastic bottle": 80,
}

// Lowercased lookup to make matching robust
export const emissionFactorsLowercase = Object.fromEntries(
  Object.entries(emissionFactors).map(([key, value]) => [key.toLowerCase(), value])
)
