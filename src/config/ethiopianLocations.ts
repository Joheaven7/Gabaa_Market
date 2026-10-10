/**
 * ZEMEN MARKET — Ethiopian Geographic & Address Data
 * Comprehensive list of Addis Ababa subcities and major Ethiopian regional cities.
 */

export interface LocationOption {
  code: string;
  name: string;
  amharicName: string;
  isAddisAbaba: boolean;
}

export const ADDIS_ABABA_SUBCITIES: LocationOption[] = [
  { code: "BOLE", name: "Bole", amharicName: "ቦሌ", isAddisAbaba: true },
  { code: "KIRKOS", name: "Kirkos", amharicName: "ቂርቆስ", isAddisAbaba: true },
  { code: "YEKA", name: "Yeka", amharicName: "የካ", isAddisAbaba: true },
  { code: "ARADA", name: "Arada", amharicName: "አራዳ", isAddisAbaba: true },
  { code: "GULELE", name: "Gulele", amharicName: "ጉለሌ", isAddisAbaba: true },
  { code: "LIDETA", name: "Lideta", amharicName: "ልደታ", isAddisAbaba: true },
  { code: "KOLFE_KERANIO", name: "Kolfe Keranio", amharicName: "ኮልፌ ቀራኒዮ", isAddisAbaba: true },
  { code: "AKAKI_KALITY", name: "Akaki Kality", amharicName: "አቃቂ ቃሊቲ", isAddisAbaba: true },
  { code: "NIFAS_SILK_LAFTO", name: "Nifas Silk-Lafto", amharicName: "ንፋስ ስልክ ላፍቶ", isAddisAbaba: true },
  { code: "ADDIS_KETEMA", name: "Addis Ketema", amharicName: "አዲስ ከተማ", isAddisAbaba: true },
  { code: "LEMI_KURA", name: "Lemi Kura", amharicName: "ለሚ ኩራ", isAddisAbaba: true },
];

export const REGIONAL_CITIES: LocationOption[] = [
  { code: "ADAMA", name: "Adama (Nazret)", amharicName: "አዳማ", isAddisAbaba: false },
  { code: "HAWASSA", name: "Hawassa", amharicName: "ሀዋሳ", isAddisAbaba: false },
  { code: "BAHIR_DAR", name: "Bahir Dar", amharicName: "ባህር ዳር", isAddisAbaba: false },
  { code: "DIRE_DAWA", name: "Dire Dawa", amharicName: "ድሬዳዋ", isAddisAbaba: false },
  { code: "BISHOFTU", name: "Bishoftu (Debre Zeyit)", amharicName: "ቢሾፍቱ", isAddisAbaba: false },
  { code: "GONDAR", name: "Gondar", amharicName: "ጎንደር", isAddisAbaba: false },
  { code: "MEKELLE", name: "Mekelle", amharicName: "መቀሌ", isAddisAbaba: false },
  { code: "JIMMA", name: "Jimma", amharicName: "ጅማ", isAddisAbaba: false },
];

export const ALL_SUPPORTED_LOCATIONS: LocationOption[] = [
  ...ADDIS_ABABA_SUBCITIES,
  ...REGIONAL_CITIES,
];

export function findLocationByCode(code: string): LocationOption | undefined {
  return ALL_SUPPORTED_LOCATIONS.find((loc) => loc.code === code);
}
