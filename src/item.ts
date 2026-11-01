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
