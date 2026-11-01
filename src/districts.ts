// Location factors from MRS-2025 (1st Bi-Annual), Finance Department KP:
// "Area Factor for Khyber Pakhtunkhwa Districts" and "Location Factor for Merged Areas" (opening pages of the PDF).
// MRS rates are Peshawar base rates; multiply by the factor for other districts.

export type District = { name: string; factor: number }

export const DISTRICTS: District[] = [
  { name: 'Abbottabad', factor: 1.03 }, { name: 'Bannu', factor: 1.03 }, { name: 'Battagram', factor: 1.08 },
  { name: 'Buner', factor: 1.09 }, { name: 'Charsadda', factor: 1.0 }, { name: 'Chitral', factor: 1.15 },
  { name: 'D.I. Khan', factor: 1.03 }, { name: 'Hangu', factor: 1.05 }, { name: 'Haripur', factor: 1.0 },
  { name: 'Karak', factor: 1.05 }, { name: 'Kohat', factor: 1.03 }, { name: 'Kohistan', factor: 1.14 },
  { name: 'Lakki Marwat', factor: 1.05 }, { name: 'Lower Dir', factor: 1.08 }, { name: 'Malakand', factor: 1.08 },
  { name: 'Mansehra', factor: 1.08 }, { name: 'Mardan', factor: 1.0 }, { name: 'Nowshera', factor: 1.0 },
  { name: 'Peshawar', factor: 1.0 }, { name: 'Shangla', factor: 1.1 }, { name: 'Swabi', factor: 1.0 },
  { name: 'Swat', factor: 1.08 }, { name: 'Tank', factor: 1.05 }, { name: 'Upper Dir', factor: 1.1 },
  { name: 'Lower Kohistan', factor: 1.14 }, { name: 'Torghar', factor: 1.14 },
  // Merged areas: sub-zones A / B / C
  ...([
    ['Bajaur', 1.06, 1.08, 1.1], ['Mohmand', 1.03, 1.05, 1.07], ['Khyber', 1.02, 1.05, 1.08],
    ['Orakzai', 1.05, 1.07, 1.12], ['Kurram', 1.05, 1.07, 1.12], ['North Waziristan', 1.05, 1.07, 1.12],
    ['South Waziristan', 1.06, 1.08, 1.1], ['FR Kohat', 1.01, 1.03, 1.05], ['FR Peshawar', 1.0, 1.0, 1.0],
    ['FR Bannu', 1.01, 1.03, 1.05], ['FR Lakki', 1.01, 1.03, 1.05], ['FR Tank', 1.03, null, 1.07],
    ['FR D.I. Khan', 1.03, 1.05, 1.08],
  ] as [string, number, number | null, number][]).flatMap(([n, a, b, c]) => [
    { name: `${n} (Zone A)`, factor: a },
    ...(b === null ? [] : [{ name: `${n} (Zone B)`, factor: b }]),
    { name: `${n} (Zone C)`, factor: c },
  ]),
]

// MRS-2025 preface, para 2: 23.5% included in MRS rates
export const OVERHEADS = [
  { key: 'kpst', label: 'KP Sales Tax', pct: 4 },
  { key: 'oh', label: 'Overheads', pct: 2 },
  { key: 'it', label: 'Income Tax', pct: 7.5 },
  { key: 'profit', label: "Contractor's Profit", pct: 10 },
] as const
export const OVERHEAD_TOTAL = OVERHEADS.reduce((s, o) => s + o.pct, 0) // 23.5
