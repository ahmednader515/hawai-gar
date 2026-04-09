export type TruckOption = {
  value: string;
  ar: string;
  en: string;
};

export const TRUCK_SIZE_OPTIONS: TruckOption[] = [
  { value: "تريلا", ar: "تريلا", en: "Trailer" },
  { value: "سقس", ar: "سقس", en: "Saqs" },
  { value: "لوري 7 متر", ar: "لوري 7 متر", en: "7m Lorry" },
  { value: "لوري", ar: "لوري", en: "Lorry" },
  { value: "دينا", ar: "دينا", en: "Dyna" },
  { value: "ونيت", ar: "ونيت", en: "Pickup" },
];

export const TRUCK_TYPE_OPTIONS_BY_SIZE: Record<string, TruckOption[]> = {
  تريلا: [
    { value: "جوانب الماني", ar: "جوانب الماني", en: "German sides" },
    { value: "ستارة", ar: "ستارة", en: "Curtain side" },
    { value: "ثلاجة مبرد", ar: "ثلاجة مبرد", en: "Refrigerated" },
    { value: "سطحة", ar: "سطحة", en: "Flatbed" },
    { value: "جوانب عالية", ar: "جوانب عالية", en: "High sides" },
    { value: "تجميد", ar: "تجميد", en: "Freezer" },
    { value: "سطحة ثلاث", ar: "سطحة ثلاث", en: "Triple-axle flatbed" },
  ],
  سقس: [
    { value: "جوانب", ar: "جوانب", en: "Sides" },
    { value: "ثلاجة مبرد", ar: "ثلاجة مبرد", en: "Refrigerated" },
  ],
  "لوري 7 متر": [{ value: "جوانب", ar: "جوانب", en: "Sides" }],
  لوري: [
    { value: "جوانب", ar: "جوانب", en: "Sides" },
    { value: "صندوق مغلق", ar: "صندوق مغلق", en: "Closed box" },
    { value: "ثلاجة مبرد", ar: "ثلاجة مبرد", en: "Refrigerated" },
    { value: "كرين 5 طن", ar: "كرين 5 طن", en: "Crane 5t" },
    { value: "كرين 7 طن", ar: "كرين 7 طن", en: "Crane 7t" },
    { value: "ثلاجة مجمد", ar: "ثلاجة مجمد", en: "Freezer truck" },
  ],
  دينا: [
    { value: "صندوق مغلق", ar: "صندوق مغلق", en: "Closed box" },
    { value: "كرين", ar: "كرين", en: "Crane" },
    { value: "ثلاجة مبرد", ar: "ثلاجة مبرد", en: "Refrigerated" },
    { value: "جوانب", ar: "جوانب", en: "Sides" },
    { value: "ثلاجة مجمد", ar: "ثلاجة مجمد", en: "Freezer truck" },
  ],
  ونيت: [{ value: "ونيت", ar: "ونيت", en: "Pickup" }],
};
