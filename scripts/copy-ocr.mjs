// Copies the free OCR engine (Tesseract.js) and English language data into public/ocr
// so the app reads photos without depending on any other website. Runs before every build.
import { cpSync, mkdirSync } from 'node:fs'

const out = 'public/ocr'
mkdirSync(out, { recursive: true })
const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
]
for (const [from, to] of files) cpSync(from, `${out}/${to}`)
console.log('OCR files copied to public/ocr')
