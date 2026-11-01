// Extras that commonly explain why an item costs more than the MRS item.
// {curly} parts are values the engineer MUST type (the app never fills numbers).
// Add new categories or extras here as you meet them in estimates.

export type Category = { id: string; name: string; match: RegExp; extras: string[] }

export const CATEGORIES: Category[] = [
  {
    id: 'ac', name: 'Air conditioner',
    match: /\b(a\.?c|air[\s-]?condition\w*|split\s+(unit|ac|type)|inverter\s+ac|window\s+ac|cassette)\b/i,
    extras: [
      'DC inverter technology with heat and cool function',
      'T3 compressor suitable for high ambient temperature',
      'eco-friendly refrigerant {type, e.g. R-410A / R-32}',
      'copper piping of {length} ft with insulation and drain pipe',
      'outdoor unit wall brackets / stand',
      'automatic voltage stabilizer of {capacity} kVA',
      'MCB / isolator switch of {rating} A in surface-mounted box',
      'power cable of {size} mm² from distribution board to the unit',
      'wall cutting for piping and making good the damages',
      'remote control and batteries',
      "manufacturer's warranty of {years} years on compressor and {years} year(s) on parts",
    ],
  },
  {
    id: 'fan', name: 'Fan',
    match: /\b(fan|fans|exhaust)\b/i,
    extras: [
      'sweep / size {size}',
      'pure copper winding motor of {watts} W',
      'electronic speed regulator',
      'down rod, canopy, hook and clamp',
      'capacitor and all necessary fittings',
      "manufacturer's warranty of {years} years",
    ],
  },
  {
    id: 'light', name: 'Light fixture',
    match: /\b(light|lights|led|lamp|luminaire|panel\s+light|tube\s*light|flood\s*light|down\s*light)\b/i,
    extras: [
      'LED of {watts} W with output not less than {lumens} lumens',
      'colour temperature {kelvin} K',
      'ingress protection {IP rating}',
      'LED driver with surge protection',
      'mounting frame / clips and wiring up to the point',
      "manufacturer's warranty of {years} years",
    ],
  },
  {
    id: 'heater', name: 'Water heater / geyser',
    match: /\b(geyser|water\s+heater|heater)\b/i,
    extras: [
      'capacity {gallons} gallons',
      'tank of {material / gauge} with insulation',
      'thermostat and safety (pressure relief) valve',
      'gas / electric connection with valves and flexible pipes',
      'stand / wall brackets',
      "manufacturer's warranty of {years} years",
    ],
  },
  {
    id: 'pump', name: 'Water pump / motor',
    match: /\b(pump|motor|monoblock|submersible)\b/i,
    extras: [
      'capacity {HP} HP with head {ft} ft and discharge {gpm} GPM',
      'automatic pressure switch / controller',
      'starter with overload protection',
      'foot valve, non-return valve and gate valve',
      'base plate / foundation bolts',
      "manufacturer's warranty of {years} year(s)",
    ],
  },
  {
    id: 'door', name: 'Door / window',
    match: /\b(door|doors|window|windows|shutter|chowkat)\b/i,
    extras: [
      'frame of {material and section}',
      'glass {mm} mm thick {type, e.g. tinted / tempered}',
      'hinges, handles, tower bolts and door stopper',
      'mortise lock with {number} keys',
      'rubber gaskets and silicone sealant',
      'polish / paint {coats} coats',
    ],
  },
  {
    id: 'tile', name: 'Tiles / flooring / cladding',
    match: /\b(tile|tiles|flooring|marble|granite|porcelain|ceramic|cladding|dado|skirting|paver|pavers)\b/i,
    extras: [
      'size {size} and thickness {mm} mm',
      'grade / quality {grade}',
      'tile adhesive / {ratio} cement-sand bed',
      'tile spacers and grouting with {type} grout',
      'edge / corner trims',
      'cutting, wastage and making good',
    ],
  },
  {
    id: 'paint', name: 'Paint / coating',
    match: /\b(paint|painting|emulsion|enamel|coating|distemper|putty)\b/i,
    extras: [
      'surface preparation, scraping and sand papering',
      'putty / filler {coats} coat(s)',
      'primer {coats} coat(s)',
      'finishing coats {coats} of {type} paint',
    ],
  },
  {
    id: 'plumbing', name: 'Sanitary / plumbing fixture',
    match: /\b(wc|commode|basin|sink|mixer|shower|tap|bib\s*cock|cistern|urinal|bath)\b/i,
    extras: [
      'angle valves and flexible connectors',
      'waste coupling, P-trap and connections',
      'brackets / pedestal / fixing bolts',
      'chrome-plated {material} fittings',
      'testing for leakage',
    ],
  },
  {
    id: 'electrical', name: 'Electrical panel / breaker / switchgear',
    match: /\b(mccb|mcb|breaker|panel|db|distribution\s+board|switchgear|ats|changeover|busbar)\b/i,
    extras: [
      'enclosure of {SWG} SWG sheet with powder coating',
      'copper busbars of {size}',
      'earthing bar and earthing connection',
      'indicating lamps and meters',
      'cable glands, lugs and internal wiring',
      'testing and commissioning',
    ],
  },
  {
    id: 'cable', name: 'Cable / wiring',
    match: /\b(cable|cables|wire|wiring|conductor)\b/i,
    extras: [
      '{cores}-core {size} mm² copper conductor',
      'voltage grade {grade}',
      'armoured / unarmoured {type}',
      'laying in {conduit / trench / tray}',
      'cable lugs and glands at both ends',
      'insulation testing',
    ],
  },
  {
    id: 'cctv', name: 'CCTV / IT / networking',
    match: /\b(cctv|camera|cameras|nvr|dvr|network|cat-?6|router|switch\s+poe)\b/i,
    extras: [
      'cameras of {MP} MP with night vision',
      'NVR / DVR {channels} channels with {TB} TB hard disk',
      'PoE switch and cabling',
      'monitor / display {size}',
      'configuration and mobile app setup',
    ],
  },
  {
    id: 'solar', name: 'Solar system',
    match: /\b(solar|pv|photovoltaic)\b/i,
    extras: [
      'panels of {W} W each ({type})',
      'inverter of {kW} kW ({type})',
      'battery of {Ah} Ah ({type})',
      'galvanized mounting structure',
      'DC/AC cables, breakers and earthing',
      'net metering arrangement',
    ],
  },
]

export function detectCategories(text: string): Category[] {
  return CATEGORIES.filter(c => c.match.test(text))
}

// The {placeholders} inside an extra
export function slots(extra: string): string[] {
  return [...extra.matchAll(/\{([^}]+)\}/g)].map(m => m[1])
}

// Fill the placeholders in order; returns null if any value is missing
export function fill(extra: string, values: string[]): string | null {
  let i = 0
  let missing = false
  const out = extra.replace(/\{[^}]+\}/g, () => {
    const v = (values[i++] ?? '').trim()
    if (!v) missing = true
    return v
  })
  return missing ? null : out
}

// ---- Unit-aware rate comparison --------------------------------------------
// Converts "100 Sft", "Sft", "m2" etc. to a base unit and a factor.
const BASE: [RegExp, string, number][] = [
  [/^(sft|sq\.?\s*ft|psft)$/i, 'sft', 1],
  [/^(m2|sqm|sq\.?\s*m|m²)$/i, 'sft', 10.7639],
  [/^(rft|ft|running\s*ft)$/i, 'rft', 1],
  [/^(m|rmtr|rm|meter|metre)$/i, 'rft', 3.28084],
  [/^(cft|cu\.?\s*ft)$/i, 'cft', 1],
  [/^(m3|cum|cu\.?\s*m)$/i, 'cft', 35.3147],
  [/^(no\.?|nos\.?|each|number|unit|pcs?)$/i, 'no', 1],
  [/^(kg|kgs)$/i, 'kg', 1],
  [/^(tonne|ton|mt)$/i, 'kg', 1000],
  [/^(job|ls|l\.s|lump\s*sum|item|set)$/i, 'job', 1],
]

export function parseUnit(u: string): { base: string; per: number } | null {
  const m = u.trim().match(/^([\d.,]*)\s*(.*)$/)
  if (!m) return null
  const qty = m[1] ? parseFloat(m[1].replace(/,/g, '')) : 1
  const name = m[2].trim()
  for (const [re, base, f] of BASE) if (re.test(name)) return { base, per: (qty || 1) * f }
  return null
}

// Price per one base unit; null if units are not comparable
export function perBase(rate: number, unit: string): { base: string; rate: number } | null {
  const p = parseUnit(unit)
  return p ? { base: p.base, rate: rate / p.per } : null
}
