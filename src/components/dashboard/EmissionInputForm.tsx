"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Zap, Home, Plane, Utensils, Factory, Upload, Loader2, Camera, Package, Info, ChevronDown, ChevronUp, CheckCircle2, Plus, X, Settings, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface EmissionData {
  type: string
  category: string
  value: number
  unit: string
  co2?: number
  subcategory?: string
}

interface EmissionInputFormProps {
  onSubmit: (data: EmissionData) => void
  userAccountType?: "individual" | "company" | "city"
}

interface ImageAnalysisResult {
  category: string
  value: number
  unit: string
  co2: number
  confidence: number
  description: string
}

interface LifecycleBreakdown {
  phase: string
  co2: number
  percentage: number
}

// Emission factors database (kg CO2 per unit)
const EMISSION_FACTORS: any = {
  transportation: {
    "car-gasoline": { factor: 0.251, unit: "km" },
    "car-diesel": { factor: 0.228, unit: "km" },
    "car-electric": { factor: 0.053, unit: "km" },
    "car-hybrid": { factor: 0.109, unit: "km" },
    "motorcycle": { factor: 0.103, unit: "km" },
    "bus": { factor: 0.089, unit: "km" },
    "train": { factor: 0.041, unit: "km" },
    "subway": { factor: 0.028, unit: "km" },
    "bicycle": { factor: 0.005, unit: "km" },
    "walking": { factor: 0, unit: "km" },
  },
  flights: {
    "domestic-economy": { factor: 0.255, unit: "km" },
    "domestic-business": { factor: 0.384, unit: "km" },
    "short-haul-economy": { factor: 0.195, unit: "km" },
    "short-haul-business": { factor: 0.293, unit: "km" },
    "long-haul-economy": { factor: 0.195, unit: "km" },
    "long-haul-premium": { factor: 0.429, unit: "km" },
    "long-haul-business": { factor: 0.585, unit: "km" },
    "long-haul-first": { factor: 0.780, unit: "km" },
  },
  electricity: {
    "us-grid": { factor: 0.429, unit: "kWh" },
    "uk-grid": { factor: 0.233, unit: "kWh" },
    "eu-grid": { factor: 0.295, unit: "kWh" },
    "china-grid": { factor: 0.581, unit: "kWh" },
    "india-grid": { factor: 0.708, unit: "kWh" },
    "solar": { factor: 0.045, unit: "kWh" },
    "wind": { factor: 0.011, unit: "kWh" },
    "hydro": { factor: 0.024, unit: "kWh" },
    "nuclear": { factor: 0.012, unit: "kWh" },
  },
  heating: {
    "natural-gas": { factor: 0.203, unit: "kWh" },
    "heating-oil": { factor: 0.298, unit: "liter" },
    "propane": { factor: 0.239, unit: "liter" },
    "electric-heat": { factor: 0.429, unit: "kWh" },
    "heat-pump": { factor: 0.143, unit: "kWh" },
    "wood-pellets": { factor: 0.039, unit: "kg" },
    "district-heating": { factor: 0.120, unit: "kWh" },
  },
  food: {
    "beef": { factor: 27.0, unit: "kg" },
    "lamb": { factor: 24.0, unit: "kg" },
    "pork": { factor: 7.2, unit: "kg" },
    "chicken": { factor: 6.1, unit: "kg" },
    "fish": { factor: 5.0, unit: "kg" },
    "cheese": { factor: 13.5, unit: "kg" },
    "milk": { factor: 1.9, unit: "liter" },
    "eggs": { factor: 4.5, unit: "kg" },
    "rice": { factor: 4.0, unit: "kg" },
    "vegetables": { factor: 0.5, unit: "kg" },
    "fruits": { factor: 0.7, unit: "kg" },
    "legumes": { factor: 0.9, unit: "kg" },
  },
  manufacturing: {
    "steel-production": { factor: 2.3, unit: "kg" },
    "aluminum-production": { factor: 11.5, unit: "kg" },
    "cement-production": { factor: 0.9, unit: "kg" },
    "plastic-production": { factor: 3.5, unit: "kg" },
    "paper-production": { factor: 1.2, unit: "kg" },
    "glass-production": { factor: 0.9, unit: "kg" },
  },
  energy: {
    "grid-industrial-us": { factor: 0.45, unit: "kWh" },
    "grid-industrial-eu": { factor: 0.31, unit: "kWh" },
    "onsite-solar": { factor: 0.05, unit: "kWh" },
    "onsite-wind": { factor: 0.01, unit: "kWh" },
  },
  waste: {
    "landfill-waste": { factor: 0.5, unit: "kg" },
    "incineration": { factor: 0.3, unit: "kg" },
    "recycling": { factor: 0.1, unit: "kg" },
    "composting": { factor: 0.05, unit: "kg" },
  },
  supply_chain: {
    "upstream-avg": { factor: 0.5, unit: "unit" },
    "downstream-avg": { factor: 0.3, unit: "unit" },
    "freight-truck": { factor: 0.1, unit: "ton-km" },
    "freight-ship": { factor: 0.015, unit: "ton-km" },
  },
  public_transport: {
    "bus-fleet-diesel": { factor: 0.089, unit: "km" },
    "bus-fleet-electric": { factor: 0.028, unit: "km" },
    "tram-electric": { factor: 0.041, unit: "km" },
    "metro-electric": { factor: 0.028, unit: "km" },
  },
  buildings: {
    "office-natural-gas": { factor: 0.15, unit: "m²" },
    "office-electric": { factor: 0.08, unit: "m²" },
    "residential-avg": { factor: 0.05, unit: "m²" },
  },
  street_lighting: {
    "led-lights": { factor: 0.15, unit: "kWh" },
    "traditional-lights": { factor: 0.45, unit: "kWh" },
  },
  waste_management: {
    "municipal-landfill": { factor: 0.5, unit: "ton" },
    "recycling-facility": { factor: 0.1, unit: "ton" },
    "composting-facility": { factor: 0.05, unit: "ton" },
  },
  water_treatment: {
    "water-supply": { factor: 0.5, unit: "m³" },
    "wastewater-treatment": { factor: 0.3, unit: "m³" },
  },
}

// Product LCA material emission factors (kg CO2e per kg of material)
const MATERIAL_FACTORS: { [key: string]: number } = {
  plastic: 3.5,
  metal: 2.3,
  aluminum: 11.5,
  steel: 2.3,
  glass: 0.9,
  wood: 0.5,
  paper: 1.2,
  electronics: 15.0,
  rubber: 3.2,
  textile: 8.0,
}

export function EmissionInputForm({ onSubmit, userAccountType = "individual" }: EmissionInputFormProps) {
  const [category, setCategory] = useState("transportation")
  const [value, setValue] = useState("")
  const [unit, setUnit] = useState("km")
  const [inputMethod, setInputMethod] = useState<"manual" | "image" | "product">("manual")
  
  // Advanced mode state
  const [advancedMode, setAdvancedMode] = useState(true)
  const [transportType, setTransportType] = useState("car-gasoline")
  const [flightClass, setFlightClass] = useState("domestic-economy")
  const [electricityRegion, setElectricityRegion] = useState("us-grid")
  const [heatingType, setHeatingType] = useState("natural-gas")
  const [foodType, setFoodType] = useState("chicken")
  
  // Company-specific subcategories
  const [companyManufacturing, setCompanyManufacturing] = useState("steel-production")
  const [companyEnergy, setCompanyEnergy] = useState("grid-industrial-us")
  const [companyFleet, setCompanyFleet] = useState("light-duty-fleet")
  const [companyWaste, setCompanyWaste] = useState("landfill-waste")
  const [companySupplyChain, setCompanySupplyChain] = useState("upstream-avg")
  
  // City-specific subcategories
  const [cityPublicTransport, setCityPublicTransport] = useState("bus-fleet-diesel")
  const [cityBuildings, setCityBuildings] = useState("office-natural-gas")
  const [cityStreetLighting, setCityStreetLighting] = useState("led-lights")
  const [cityWasteManagement, setCityWasteManagement] = useState("municipal-landfill")
  const [cityWaterTreatment, setCityWaterTreatment] = useState("water-supply")
  
  // Real-time CO2 calculation
  const [calculatedCO2, setCalculatedCO2] = useState<number | null>(null)
  const [emissionFactor, setEmissionFactor] = useState<any>(null)
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null)

  // Product LCA fields
  const [productName, setProductName] = useState("")
  const [productWeight, setProductWeight] = useState("")
  const [systemBoundary, setSystemBoundary] = useState<"cradle-to-gate" | "cradle-to-grave" | "cradle-to-use">("cradle-to-grave")
  const [region, setRegion] = useState("global")
  const [lifetime, setLifetime] = useState("")
  const [usageHours, setUsageHours] = useState("")
  const [transportDistance, setTransportDistance] = useState("")
  const [materialComposition, setMaterialComposition] = useState<Array<{material: string, percentage: number}>>([
    { material: "plastic", percentage: 40 },
    { material: "metal", percentage: 30 },
    { material: "electronics", percentage: 30 }
  ])
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [calculatedBreakdown, setCalculatedBreakdown] = useState<LifecycleBreakdown[]>([])
  const [showProductPreview, setShowProductPreview] = useState(false)
  const [productPreviewData, setProductPreviewData] = useState<{ weight: number; breakdown: LifecycleBreakdown[]; totalCO2: number } | null>(null)

  // Update category-specific state when category changes
  useEffect(() => {
    const categoryConfig: { [key: string]: { unit: string; subcategory?: string } } = {
      transportation: { unit: "km", subcategory: transportType },
      electricity: { unit: "kWh", subcategory: electricityRegion },
      heating: { unit: "kWh", subcategory: heatingType },
      flights: { unit: "km", subcategory: flightClass },
      food: { unit: "kg", subcategory: foodType },
      manufacturing: { unit: "kg", subcategory: companyManufacturing },
      energy: { unit: "kWh", subcategory: companyEnergy },
      waste: { unit: "kg", subcategory: companyWaste },
      supply_chain: { unit: "unit", subcategory: companySupplyChain },
      public_transport: { unit: "km", subcategory: cityPublicTransport },
      buildings: { unit: "m²", subcategory: cityBuildings },
      street_lighting: { unit: "kWh", subcategory: cityStreetLighting },
      waste_management: { unit: "ton", subcategory: cityWasteManagement },
      water_treatment: { unit: "m³", subcategory: cityWaterTreatment },
    }

    const config = categoryConfig[category]
    if (config) {
      setUnit(config.unit)
    }
  }, [category, transportType, electricityRegion, heatingType, flightClass, foodType, 
      companyManufacturing, companyEnergy, companyWaste, companySupplyChain,
      cityPublicTransport, cityBuildings, cityStreetLighting, cityWasteManagement, cityWaterTreatment])

  // Calculate CO2 in real-time
  useEffect(() => {
    if (!value || !advancedMode) {
      setCalculatedCO2(null)
      return
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      setCalculatedCO2(null)
      return
    }

    let subcategory = ""
    let factorDb = EMISSION_FACTORS[category]

    // Determine subcategory based on category
    if (category === "transportation") subcategory = transportType
    else if (category === "flights") subcategory = flightClass
    else if (category === "electricity") subcategory = electricityRegion
    else if (category === "heating") subcategory = heatingType
    else if (category === "food") subcategory = foodType
    else if (category === "manufacturing") subcategory = companyManufacturing
    else if (category === "energy") subcategory = companyEnergy
    else if (category === "waste") subcategory = companyWaste
    else if (category === "supply_chain") subcategory = companySupplyChain
    else if (category === "public_transport") subcategory = cityPublicTransport
    else if (category === "buildings") subcategory = cityBuildings
    else if (category === "street_lighting") subcategory = cityStreetLighting
    else if (category === "waste_management") subcategory = cityWasteManagement
    else if (category === "water_treatment") subcategory = cityWaterTreatment

    if (factorDb && subcategory && factorDb[subcategory]) {
      const factor = factorDb[subcategory].factor
      setEmissionFactor(factorDb[subcategory])
      const co2Kg = numValue * factor
      setCalculatedCO2(co2Kg)
    } else {
      setCalculatedCO2(null)
      setEmissionFactor(null)
    }
  }, [value, category, transportType, flightClass, electricityRegion, heatingType, foodType, 
      advancedMode, companyManufacturing, companyEnergy, companyWaste, companySupplyChain,
      cityPublicTransport, cityBuildings, cityStreetLighting, cityWasteManagement, cityWaterTreatment])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (inputMethod === "image" && analysisResult) {
      onSubmit({
        type: userAccountType || "individual",
        category: analysisResult.category,
        value: analysisResult.value,
        unit: analysisResult.unit,
        co2: analysisResult.co2,
      })
      
      // Reset form
      setImageFile(null)
      setImagePreview(null)
      setAnalysisResult(null)
      return
    }

    if (inputMethod === "product" && productName && productWeight) {
      // Show preview instead of submitting directly
      if (!showProductPreview) {
        const weight = parseFloat(productWeight)
        const breakdown = calculateProductLCA(weight)
        const totalCO2 = breakdown.reduce((sum, phase) => sum + phase.co2, 0)
        
        setProductPreviewData({ weight, breakdown, totalCO2 })
        setShowProductPreview(true)
        return
      }

      // If preview is confirmed, submit the data
      if (showProductPreview && productPreviewData) {
        onSubmit({
          type: userAccountType || "individual",
          category: "product_lca",
          value: productPreviewData.weight,
          unit: "kg",
          co2: productPreviewData.totalCO2 * 1000, // Convert to grams
          subcategory: productName,
        })

        // Reset form
        setProductName("")
        setProductWeight("")
        setMaterialComposition([
          { material: "plastic", percentage: 40 },
          { material: "metal", percentage: 30 },
          { material: "electronics", percentage: 30 }
        ])
        setLifetime("")
        setUsageHours("")
        setTransportDistance("")
        setShowBreakdown(false)
        setCalculatedBreakdown([])
        setShowProductPreview(false)
        setProductPreviewData(null)
        return
      }
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      toast.error("Please enter a valid value")
      return
    }

    // Get subcategory
    let subcategory = ""
    if (category === "transportation") subcategory = transportType
    else if (category === "flights") subcategory = flightClass
    else if (category === "electricity") subcategory = electricityRegion
    else if (category === "heating") subcategory = heatingType
    else if (category === "food") subcategory = foodType
    else if (category === "manufacturing") subcategory = companyManufacturing
    else if (category === "energy") subcategory = companyEnergy
    else if (category === "waste") subcategory = companyWaste
    else if (category === "supply_chain") subcategory = companySupplyChain
    else if (category === "public_transport") subcategory = cityPublicTransport
    else if (category === "buildings") subcategory = cityBuildings
    else if (category === "street_lighting") subcategory = cityStreetLighting
    else if (category === "waste_management") subcategory = cityWasteManagement
    else if (category === "water_treatment") subcategory = cityWaterTreatment

    onSubmit({
      type: userAccountType || "individual",
      category,
      value: numValue,
      unit,
      co2: advancedMode && calculatedCO2 ? calculatedCO2 * 1000 : undefined, // Convert to grams
      subcategory: advancedMode ? subcategory : undefined,
    })

    // Reset form
    setValue("")
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

    const analyzeImage = async () => {
      if (!imageFile) {
        toast.error("Please select an image first")
        return
      }

      setIsAnalyzing(true)
      
      try {
        const formData = new FormData()
        formData.append("image", imageFile)

        const response = await fetch("/api/image-emission", {
          method: "POST",
          body: formData,
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok || !payload) {
          const message = payload?.error || "Failed to analyze image"
          throw new Error(message)
        }

        const normalized: ImageAnalysisResult = {
          category: payload.category || payload?.emission?.category || "general_waste",
          value: payload.value || 1,
          unit: payload.unit || "item",
          co2: payload.co2 || Math.round((payload?.emission?.co2_kg || 0.1) * 1000),
          confidence: payload.confidence ?? payload?.detection?.confidence ?? 0,
          description: payload.description || `Detected ${payload?.detection?.label || "object"}. Estimated ${(payload?.emission?.co2_kg || 0.1).toFixed(2)} kg CO₂e.`,
        }

        setAnalysisResult(normalized)
        toast.success("Image analyzed successfully!")
      } catch (error: any) {
        console.error("Failed to analyze image:", error)
        toast.error(error?.message || "Failed to analyze image. Please try again.")
      } finally {
        setIsAnalyzing(false)
      }
    }


  const calculateProductLCA = (productWeightKg: number): LifecycleBreakdown[] => {
    const breakdown: LifecycleBreakdown[] = []

    // 1. Materials/Manufacturing
    let materialsCO2 = 0
    materialComposition.forEach(({ material, percentage }) => {
      const factor = MATERIAL_FACTORS[material] || 3.0
      materialsCO2 += (productWeightKg * percentage / 100) * factor
    })
    breakdown.push({ phase: "Materials & Manufacturing", co2: materialsCO2, percentage: 0 })

    // 2. Transportation
    const transportDistanceKm = parseFloat(transportDistance) || 500 // Default 500km
    const transportCO2 = (productWeightKg * transportDistanceKm * 0.1) // 0.1 kg CO2 per kg per km
    breakdown.push({ phase: "Transportation", co2: transportCO2, percentage: 0 })

    // 3. Use Phase (if cradle-to-grave or cradle-to-use)
    let useCO2 = 0
    if (systemBoundary === "cradle-to-grave" || systemBoundary === "cradle-to-use") {
      const lifetimeYears = parseFloat(lifetime) || 5
      const hoursPerYear = parseFloat(usageHours) || 100
      const powerConsumption = productWeightKg * 0.05 // Assume 0.05 kWh per kg per hour
      const gridEmissionFactor = region === "us" ? 0.429 : region === "eu" ? 0.295 : 0.4 // kg CO2 per kWh
      useCO2 = lifetimeYears * hoursPerYear * powerConsumption * gridEmissionFactor
      breakdown.push({ phase: "Use Phase", co2: useCO2, percentage: 0 })
    }

    // 4. End of Life (if cradle-to-grave)
    let eolCO2 = 0
    if (systemBoundary === "cradle-to-grave") {
      eolCO2 = productWeightKg * 0.5 // 0.5 kg CO2 per kg for disposal
      breakdown.push({ phase: "End of Life", co2: eolCO2, percentage: 0 })
    }

    // Calculate percentages
    const totalCO2 = breakdown.reduce((sum, phase) => sum + phase.co2, 0)
    breakdown.forEach(phase => {
      phase.percentage = (phase.co2 / totalCO2) * 100
    })

    setCalculatedBreakdown(breakdown)
    return breakdown
  }

  const addMaterialRow = () => {
    setMaterialComposition([...materialComposition, { material: "plastic", percentage: 0 }])
  }

  const removeMaterialRow = (index: number) => {
    const updated = materialComposition.filter((_, i) => i !== index)
    setMaterialComposition(updated)
  }

  const updateMaterial = (index: number, field: "material" | "percentage", value: string | number) => {
    const updated = [...materialComposition]
    updated[index] = { ...updated[index], [field]: value }
    setMaterialComposition(updated)
  }

  // Get categories based on user account type
  const getAvailableCategories = () => {
    if (userAccountType === "company") {
      return [
        { value: "manufacturing", label: "Manufacturing", icon: Factory },
        { value: "energy", label: "Energy", icon: Zap },
        { value: "transportation", label: "Fleet", icon: Car },
        { value: "waste", label: "Waste", icon: Factory },
        { value: "supply_chain", label: "Supply Chain", icon: Package },
      ]
    } else if (userAccountType === "city") {
      return [
        { value: "public_transport", label: "Public Transport", icon: Car },
        { value: "buildings", label: "Buildings", icon: Home },
        { value: "street_lighting", label: "Street Lighting", icon: Zap },
        { value: "waste_management", label: "Waste Management", icon: Factory },
        { value: "water_treatment", label: "Water Treatment", icon: Factory },
      ]
    } else {
      // Individual
      return [
        { value: "transportation", label: "Transportation", icon: Car },
        { value: "electricity", label: "Electricity", icon: Zap },
        { value: "heating", label: "Heating", icon: Home },
        { value: "flights", label: "Flights", icon: Plane },
        { value: "food", label: "Food", icon: Utensils },
      ]
    }
  }

  const categories = getAvailableCategories()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Entry</CardTitle>
        <CardDescription>Log your carbon emissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <Settings className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="image">
              <Camera className="h-4 w-4 mr-2" />
              Image
            </TabsTrigger>
            <TabsTrigger value="product">
              <Package className="h-4 w-4 mr-2" />
              Product LCA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Precision Mode Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <Label htmlFor="advanced-mode" className="cursor-pointer">
                    Precision Mode
                  </Label>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <Switch
                  id="advanced-mode"
                  checked={advancedMode}
                  onCheckedChange={setAdvancedMode}
                />
              </div>

              {/* Activity Category */}
              <div className="space-y-2">
                <Label>Activity Category</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    return (
                      <Button
                        key={cat.value}
                        type="button"
                        variant={category === cat.value ? "default" : "outline"}
                        className="flex flex-col h-auto py-3 gap-1 px-2"
                        onClick={() => setCategory(cat.value)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-xs text-center break-words line-clamp-2">{cat.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Precision Mode Fields */}
              {advancedMode && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  {category === "transportation" && (
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Select value={transportType} onValueChange={setTransportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="car-gasoline">Car (Gasoline)</SelectItem>
                          <SelectItem value="car-diesel">Car (Diesel)</SelectItem>
                          <SelectItem value="car-electric">Car (Electric)</SelectItem>
                          <SelectItem value="car-hybrid">Car (Hybrid)</SelectItem>
                          <SelectItem value="motorcycle">Motorcycle</SelectItem>
                          <SelectItem value="bus">Bus</SelectItem>
                          <SelectItem value="train">Train</SelectItem>
                          <SelectItem value="subway">Subway</SelectItem>
                          <SelectItem value="bicycle">Bicycle</SelectItem>
                          <SelectItem value="walking">Walking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "flights" && (
                    <div className="space-y-2">
                      <Label>Flight Class</Label>
                      <Select value={flightClass} onValueChange={setFlightClass}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="domestic-economy">Domestic - Economy</SelectItem>
                          <SelectItem value="domestic-business">Domestic - Business</SelectItem>
                          <SelectItem value="short-haul-economy">Short Haul - Economy</SelectItem>
                          <SelectItem value="short-haul-business">Short Haul - Business</SelectItem>
                          <SelectItem value="long-haul-economy">Long Haul - Economy</SelectItem>
                          <SelectItem value="long-haul-premium">Long Haul - Premium</SelectItem>
                          <SelectItem value="long-haul-business">Long Haul - Business</SelectItem>
                          <SelectItem value="long-haul-first">Long Haul - First Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "electricity" && (
                    <div className="space-y-2">
                      <Label>Grid Region</Label>
                      <Select value={electricityRegion} onValueChange={setElectricityRegion}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-grid">United States</SelectItem>
                          <SelectItem value="uk-grid">United Kingdom</SelectItem>
                          <SelectItem value="eu-grid">European Union</SelectItem>
                          <SelectItem value="china-grid">China</SelectItem>
                          <SelectItem value="india-grid">India</SelectItem>
                          <SelectItem value="solar">Solar Power</SelectItem>
                          <SelectItem value="wind">Wind Power</SelectItem>
                          <SelectItem value="hydro">Hydroelectric</SelectItem>
                          <SelectItem value="nuclear">Nuclear</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "heating" && (
                    <div className="space-y-2">
                      <Label>Heating Type</Label>
                      <Select value={heatingType} onValueChange={setHeatingType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="natural-gas">Natural Gas</SelectItem>
                          <SelectItem value="heating-oil">Heating Oil</SelectItem>
                          <SelectItem value="propane">Propane</SelectItem>
                          <SelectItem value="electric-heat">Electric Heat</SelectItem>
                          <SelectItem value="heat-pump">Heat Pump</SelectItem>
                          <SelectItem value="wood-pellets">Wood Pellets</SelectItem>
                          <SelectItem value="district-heating">District Heating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "food" && (
                    <div className="space-y-2">
                      <Label>Food Type</Label>
                      <Select value={foodType} onValueChange={setFoodType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beef">Beef</SelectItem>
                          <SelectItem value="lamb">Lamb</SelectItem>
                          <SelectItem value="pork">Pork</SelectItem>
                          <SelectItem value="chicken">Chicken</SelectItem>
                          <SelectItem value="fish">Fish</SelectItem>
                          <SelectItem value="cheese">Cheese</SelectItem>
                          <SelectItem value="milk">Milk</SelectItem>
                          <SelectItem value="eggs">Eggs</SelectItem>
                          <SelectItem value="rice">Rice</SelectItem>
                          <SelectItem value="vegetables">Vegetables</SelectItem>
                          <SelectItem value="fruits">Fruits</SelectItem>
                          <SelectItem value="legumes">Legumes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "manufacturing" && (
                    <div className="space-y-2">
                      <Label>Manufacturing Type</Label>
                      <Select value={companyManufacturing} onValueChange={setCompanyManufacturing}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="steel-production">Steel Production</SelectItem>
                          <SelectItem value="aluminum-production">Aluminum Production</SelectItem>
                          <SelectItem value="cement-production">Cement Production</SelectItem>
                          <SelectItem value="plastic-production">Plastic Production</SelectItem>
                          <SelectItem value="paper-production">Paper Production</SelectItem>
                          <SelectItem value="glass-production">Glass Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "energy" && (
                    <div className="space-y-2">
                      <Label>Energy Source</Label>
                      <Select value={companyEnergy} onValueChange={setCompanyEnergy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid-industrial-us">US Industrial Grid</SelectItem>
                          <SelectItem value="grid-industrial-eu">EU Industrial Grid</SelectItem>
                          <SelectItem value="onsite-solar">On-site Solar</SelectItem>
                          <SelectItem value="onsite-wind">On-site Wind</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "waste" && (
                    <div className="space-y-2">
                      <Label>Waste Type</Label>
                      <Select value={companyWaste} onValueChange={setCompanyWaste}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landfill-waste">Landfill</SelectItem>
                          <SelectItem value="incineration">Incineration</SelectItem>
                          <SelectItem value="recycling">Recycling</SelectItem>
                          <SelectItem value="composting">Composting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "supply_chain" && (
                    <div className="space-y-2">
                      <Label>Supply Chain Type</Label>
                      <Select value={companySupplyChain} onValueChange={setCompanySupplyChain}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upstream-avg">Upstream Average</SelectItem>
                          <SelectItem value="downstream-avg">Downstream Average</SelectItem>
                          <SelectItem value="freight-truck">Freight (Truck)</SelectItem>
                          <SelectItem value="freight-ship">Freight (Ship)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "public_transport" && (
                    <div className="space-y-2">
                      <Label>Transport Type</Label>
                      <Select value={cityPublicTransport} onValueChange={setCityPublicTransport}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bus-fleet-diesel">Bus Fleet (Diesel)</SelectItem>
                          <SelectItem value="bus-fleet-electric">Bus Fleet (Electric)</SelectItem>
                          <SelectItem value="tram-electric">Tram (Electric)</SelectItem>
                          <SelectItem value="metro-electric">Metro (Electric)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "buildings" && (
                    <div className="space-y-2">
                      <Label>Building Type</Label>
                      <Select value={cityBuildings} onValueChange={setCityBuildings}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office-natural-gas">Office (Natural Gas)</SelectItem>
                          <SelectItem value="office-electric">Office (Electric)</SelectItem>
                          <SelectItem value="residential-avg">Residential Average</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "street_lighting" && (
                    <div className="space-y-2">
                      <Label>Lighting Type</Label>
                      <Select value={cityStreetLighting} onValueChange={setCityStreetLighting}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="led-lights">LED Lights</SelectItem>
                          <SelectItem value="traditional-lights">Traditional Lights</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "waste_management" && (
                    <div className="space-y-2">
                      <Label>Facility Type</Label>
                      <Select value={cityWasteManagement} onValueChange={setCityWasteManagement}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="municipal-landfill">Municipal Landfill</SelectItem>
                          <SelectItem value="recycling-facility">Recycling Facility</SelectItem>
                          <SelectItem value="composting-facility">Composting Facility</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {category === "water_treatment" && (
                    <div className="space-y-2">
                      <Label>Treatment Type</Label>
                      <Select value={cityWaterTreatment} onValueChange={setCityWaterTreatment}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="water-supply">Water Supply</SelectItem>
                          <SelectItem value="wastewater-treatment">Wastewater Treatment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                    {/* Real-time CO2 calculation display */}
                    {calculatedCO2 !== null && emissionFactor && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Estimated Emissions</AlertTitle>
                        <AlertDescription>
                          <span className="font-semibold text-lg">{calculatedCO2.toFixed(2)} kg CO₂e</span>
                          <div className="mt-3 space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Emission Factor:</span>
                              <span className="font-medium">{emissionFactor.factor} kg CO₂e per {emissionFactor.unit}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Calculation:</span>
                              <span className="font-medium">{value} {emissionFactor.unit} × {emissionFactor.factor} = {calculatedCO2.toFixed(2)} kg CO₂e</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Source:</span>
                              <span className="font-medium">IPCC, EPA, DEFRA standards</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex items-start gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                              <Info className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-green-900 dark:text-green-100">High Precision</p>
                                <p className="text-green-700 dark:text-green-300">Using industry-standard emission factors from IPCC (Intergovernmental Panel on Climate Change), EPA (Environmental Protection Agency), and DEFRA (Department for Environment, Food & Rural Affairs) guidelines</p>
                              </div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <div className="flex gap-2">
                  <Input
                    id="value"
                    type="number"
                    placeholder="Enter value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                  />
                  <div className="w-24">
                    <Input value={unit} disabled className="bg-muted" />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Add Emission
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="image" className="space-y-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                        setAnalysisResult(null)
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 10MB
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {imageFile && !analysisResult && (
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      Analyze Image
                    </>
                  )}
                </Button>
              )}

              {analysisResult && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Analysis Complete</AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-1">
                        <p><span className="font-semibold">Category:</span> {analysisResult.category}</p>
                        <p><span className="font-semibold">Value:</span> {analysisResult.value} {analysisResult.unit}</p>
                        <p><span className="font-semibold">CO₂:</span> {(analysisResult.co2 / 1000).toFixed(2)} kg</p>
                        <p><span className="font-semibold">Confidence:</span> {(analysisResult.confidence * 100).toFixed(0)}%</p>
                        <p className="text-xs mt-2">{analysisResult.description}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                  <Button onClick={handleSubmit} className="w-full">
                    Add to Emissions
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="product" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Product Life Cycle Assessment</AlertTitle>
              <AlertDescription>
                Calculate emissions across the entire product lifecycle: materials, manufacturing,
                transportation, use, and end-of-life.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="e.g., Laptop, Smartphone"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-weight">Product Weight (kg)</Label>
                <Input
                  id="product-weight"
                  type="number"
                  placeholder="e.g., 2.5"
                  value={productWeight}
                  onChange={(e) => {
                    setProductWeight(e.target.value)
                    if (e.target.value) {
                      calculateProductLCA(parseFloat(e.target.value))
                    }
                  }}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>System Boundary</Label>
                <Select value={systemBoundary} onValueChange={(v: any) => setSystemBoundary(v)} >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cradle-to-gate">Cradle-to-Gate (Materials + Manufacturing)</SelectItem>
                    <SelectItem value="cradle-to-use">Cradle-to-Use (+ Transportation + Use)</SelectItem>
                    <SelectItem value="cradle-to-grave">Cradle-to-Grave (Full Lifecycle)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Material Composition</Label>
                <div className="space-y-2">
                  {materialComposition.map((material, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={material.material}
                        onValueChange={(v) => updateMaterial(index, "material", v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plastic">Plastic</SelectItem>
                          <SelectItem value="metal">Metal/Steel</SelectItem>
                          <SelectItem value="aluminum">Aluminum</SelectItem>
                          <SelectItem value="glass">Glass</SelectItem>
                          <SelectItem value="wood">Wood</SelectItem>
                          <SelectItem value="paper">Paper/Cardboard</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="rubber">Rubber</SelectItem>
                          <SelectItem value="textile">Textile</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="%"
                          value={material.percentage}
                          onChange={(e) => updateMaterial(index, "percentage", parseFloat(e.target.value) || 0)}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                        {productWeight && (
                          <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[60px]">
                            ({((parseFloat(productWeight) * material.percentage) / 100).toFixed(2)} kg)
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMaterialRow(index)}
                        disabled={materialComposition.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addMaterialRow} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>
              </div>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" type="button" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Advanced Options
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Manufacturing Region</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global Average</SelectItem>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="eu">European Union</SelectItem>
                        <SelectItem value="china">China</SelectItem>
                        <SelectItem value="india">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transport-distance">Transportation Distance (km)</Label>
                    <Input
                      id="transport-distance"
                      type="number"
                      placeholder="e.g., 5000"
                      value={transportDistance}
                      onChange={(e) => setTransportDistance(e.target.value)}
                      step="1"
                      min="0"
                    />
                  </div>

                  {(systemBoundary === "cradle-to-use" || systemBoundary === "cradle-to-grave") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="lifetime">Product Lifetime (years)</Label>
                        <Input
                          id="lifetime"
                          type="number"
                          placeholder="e.g., 5"
                          value={lifetime}
                          onChange={(e) => setLifetime(e.target.value)}
                          step="0.1"
                          min="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="usage-hours">Usage Hours per Year</Label>
                        <Input
                          id="usage-hours"
                          type="number"
                          placeholder="e.g., 2000"
                          value={usageHours}
                          onChange={(e) => setUsageHours(e.target.value)}
                          step="1"
                          min="0"
                        />
                      </div>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {calculatedBreakdown.length > 0 && (
                <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" type="button" className="w-full">
                      <Package className="h-4 w-4 mr-2" />
                      View Lifecycle Breakdown
                      {showBreakdown ? (
                        <ChevronUp className="h-4 w-4 ml-auto" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Alert className="mt-4">
                      <AlertTitle>Lifecycle CO₂ Breakdown</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-2 mt-2">
                          {calculatedBreakdown.map((phase) => (
                            <div key={phase.phase} className="flex justify-between items-center">
                              <span className="text-sm">{phase.phase}</span>
                              <div className="text-right">
                                <span className="font-semibold">{phase.co2.toFixed(2)} kg CO₂e</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({phase.percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center font-bold">
                            <span>Total</span>
                            <span>
                              {calculatedBreakdown.reduce((sum, p) => sum + p.co2, 0).toFixed(2)} kg CO₂e
                            </span>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <Button type="submit" className="w-full" disabled={!productName || !productWeight}>
                {showProductPreview ? "Confirm & Add Emission" : "Calculate Emissions"}
              </Button>

              {/* Emission Preview */}
              {showProductPreview && productPreviewData && (
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900 dark:text-orange-100">Review Emissions Before Adding</AlertTitle>
                  <AlertDescription className="space-y-3 text-orange-800 dark:text-orange-200">
                    <p className="text-sm">
                      Please review the calculated emissions for <span className="font-semibold">{productName}</span> before adding to your dashboard.
                    </p>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
                      <div className="space-y-2">
                        {productPreviewData.breakdown.map((phase) => (
                          <div key={phase.phase} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{phase.phase}</span>
                            <div className="text-right">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {phase.co2.toFixed(2)} kg CO₂e
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({phase.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center font-bold text-base">
                          <span className="text-gray-900 dark:text-white">Total Emissions</span>
                          <span className="text-lg text-orange-600">
                            {productPreviewData.totalCO2.toFixed(2)} kg CO₂e
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowProductPreview(false)
                          setProductPreviewData(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        Confirm & Add
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}