import type { MrsItem } from './search'
import type { Details } from './nomenclature'

// The item being worked on, shared by step 2 (correct), step 3 (justify) and step 4 (analysis)
export type ItemState = {
  started: boolean   // engineer pressed "Correct nomenclature"
  input: string      // description (own text or MRS base wording)
  unit: string
  rate: string       // NSI rate typed by the engineer
  base: MrsItem | null
  details: Details
  corrected: string  // corrected wording without extras
}
export const EMPTY_ITEM: ItemState = { started: false, input: '', unit: '', rate: '', base: null, details: { includes: [] }, corrected: '' }

// What step 3 hands to step 4
export type JustifyState = {
  extras: { text: string; cost: number }[]
  ref: number          // reference rate per NSI unit (MRS x district factor, or typed)
  refLabel: string     // e.g. "MRS-2025 26-01-p-02 x 1.08 (Swat)"
  finalText: string    // final nomenclature
}
export const EMPTY_JUSTIFY: JustifyState = { extras: [], ref: 0, refLabel: '', finalText: '' }
