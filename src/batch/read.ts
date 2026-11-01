// Reads an uploaded file in the browser (nothing is sent to any server) and returns NSI items.
// Heavy libraries are loaded only when needed, so the app stays fast.
import { rowsToItems, linesToItems, pdfItemsToLines, cleanOcrLines, type RawItem } from './parse'

export type Progress = (msg: string) => void
type OcrWorker = { setParameters: (p: Record<string, string>) => Promise<unknown>; recognize: (img: HTMLCanvasElement | File) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> }

let ocr: Promise<OcrWorker> | null = null
async function getOcr(progress: Progress): Promise<OcrWorker> {
  if (!ocr) {
    ocr = (async () => {
      progress('Loading OCR (first time only, about 15 MB)…')
      const { createWorker } = await import('tesseract.js')
      // Files are served from our own site (/ocr/), copied there at build time
      const w = (await createWorker('eng', 1, {
        workerPath: '/ocr/worker.min.js',
        corePath: '/ocr/',
        langPath: '/ocr/',
        gzip: true,
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') progress(`Reading text (OCR)… ${Math.round(m.progress * 100)}%`)
        },
      })) as unknown as OcrWorker
      // Read tables row by row (page segmentation mode 4) and keep spacing
      await w.setParameters({ tessedit_pageseg_mode: '4', preserve_interword_spaces: '1' })
      return w
    })()
  }
  return ocr
}

async function ocrToLines(img: HTMLCanvasElement | File, progress: Progress): Promise<string[]> {
  const w = await getOcr(progress)
  const { data } = await w.recognize(img)
  return cleanOcrLines(data.text)
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', q = false
  const sep = (text.split('\n')[0].match(/;/g)?.length ?? 0) > (text.split('\n')[0].match(/,/g)?.length ?? 0) ? ';' : ','
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') q = false; else cell += ch }
    else if (ch === '"') q = true
    else if (ch === sep) { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

export async function readFile(file: File, progress: Progress): Promise<RawItem[]> {
  const name = file.name
  const ext = name.toLowerCase().split('.').pop() ?? ''

  if (ext === 'xls') throw new Error('OLD_XLS')

  if (ext === 'xlsx') {
    progress(`Reading ${name}…`)
    const { default: readExcelFile } = await import('read-excel-file/browser')
    const sheets = await readExcelFile(file)
    return sheets.flatMap(s => rowsToItems(s.data as unknown[][], `${name} / ${s.sheet}`))
  }

  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text()
    return ext === 'csv' ? rowsToItems(parseCsv(text), name) : linesToItems(text.split('\n'), name)
  }

  if (ext === 'pdf') {
    progress(`Opening ${name}…`)
    const pdfjs = await import('pdfjs-dist')
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    const out: RawItem[] = []
    for (let p = 1; p <= pdf.numPages; p++) {
      progress(`Reading page ${p} of ${pdf.numPages}…`)
      const page = await pdf.getPage(p)
      const tc = await page.getTextContent()
      let lines = pdfItemsToLines(tc.items as { str: string; transform: number[] }[])
      if (lines.join('').replace(/\s/g, '').length < 30) {
        // Scanned page: draw it as a picture and read it with OCR
        const vp = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width; canvas.height = vp.height
        await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
        lines = await ocrToLines(canvas, msg => progress(`Page ${p}/${pdf.numPages}: ${msg}`))
      }
      out.push(...linesToItems(lines, `${name} p.${p}`))
    }
    return out
  }

  if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext) || file.type.startsWith('image/')) {
    const lines = await ocrToLines(file, progress)
    return linesToItems(lines, name)
  }

  throw new Error('UNSUPPORTED')
}
