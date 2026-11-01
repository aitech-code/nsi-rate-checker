// All app text in English and Urdu.
// Urdu is written as \u codes so copy-paste cannot scramble it. The app shows normal Urdu.
export type Lang = 'en' | 'ur'

export const text = {
  en: {
    appName: 'NSI Rate Checker',
    subtitle: 'C&W Department, Khyber Pakhtunkhwa',
    switchTo: '\u0627\u0631\u062f\u0648',
    step1: 'Is this item already in MRS?',
    step2: 'Is the rate reasonable as per market?',
    step3: 'Correct the item nomenclature',
    step4: 'Prepare rate analysis (MRS format)',
    comingSoon: 'Coming in next phases',
    dataNote: 'Data source: MRS-2025 (1st Bi-Annual), Finance Department, Govt. of Khyber Pakhtunkhwa',
    install: 'Tip: use your browser menu \u2192 "Install app" / "Add to Home screen".',
  },
  ur: {
    appName: '\u0627\u06cc\u0646 \u0627\u06cc\u0633 \u0622\u0626\u06cc \u0631\u06cc\u0679 \u0686\u06cc\u06a9\u0631',
    subtitle: '\u0633\u06cc \u0627\u06cc\u0646\u0688 \u0688\u0628\u0644\u06cc\u0648 \u0688\u06cc\u067e\u0627\u0631\u0679\u0645\u0646\u0679\u060c \u062e\u06cc\u0628\u0631 \u067e\u062e\u062a\u0648\u0646\u062e\u0648\u0627',
    switchTo: 'English',
    step1: '\u06a9\u06cc\u0627 \u06cc\u06c1 \u0622\u0626\u0679\u0645 \u067e\u06c1\u0644\u06d2 \u0633\u06d2 \u0627\u06cc\u0645 \u0622\u0631 \u0627\u06cc\u0633 \u0645\u06cc\u06ba \u0645\u0648\u062c\u0648\u062f \u06c1\u06d2\u061f',
    step2: '\u06a9\u06cc\u0627 \u0631\u06cc\u0679 \u0645\u0627\u0631\u06a9\u06cc\u0679 \u06a9\u06d2 \u0645\u0637\u0627\u0628\u0642 \u0645\u0646\u0627\u0633\u0628 \u06c1\u06d2\u061f',
    step3: '\u0622\u0626\u0679\u0645 \u06a9\u06cc \u062f\u0631\u0633\u062a \u0646\u0627\u0645 \u0628\u0646\u062f\u06cc (\u0646\u0648\u0645\u0646\u06a9\u0644\u06cc\u0686\u0631)',
    step4: '\u0631\u06cc\u0679 \u0627\u06cc\u0646\u0627\u0644\u06cc\u0633\u0633 \u062a\u06cc\u0627\u0631 \u06a9\u0631\u06cc\u06ba (\u0627\u06cc\u0645 \u0622\u0631 \u0627\u06cc\u0633 \u0641\u0627\u0631\u0645\u06cc\u0679)',
    comingSoon: '\u0627\u06af\u0644\u06d2 \u0645\u0631\u0627\u062d\u0644 \u0645\u06cc\u06ba \u062f\u0633\u062a\u06cc\u0627\u0628 \u06c1\u0648\u06af\u0627',
    dataNote: '\u0688\u06cc\u0679\u0627 \u06a9\u0627 \u0645\u0627\u062e\u0630: \u0627\u06cc\u0645 \u0622\u0631 \u0627\u06cc\u0633 2025 (\u067e\u06c1\u0644\u0627 \u0634\u0634\u0645\u0627\u06c1\u06cc)\u060c \u0645\u062d\u06a9\u0645\u06c1 \u062e\u0632\u0627\u0646\u06c1\u060c \u062d\u06a9\u0648\u0645\u062a \u062e\u06cc\u0628\u0631 \u067e\u062e\u062a\u0648\u0646\u062e\u0648\u0627',
    install: '\u0645\u0634\u0648\u0631\u06c1: \u0628\u0631\u0627\u0624\u0632\u0631 \u0645\u06cc\u0646\u0648 \u0645\u06cc\u06ba "Install app" \u06cc\u0627 "Add to Home screen" \u062f\u0628\u0627\u0626\u06cc\u06ba\u06d4',
  },
} as const

export function loadLang(): Lang {
  try {
    return localStorage.getItem('lang') === 'ur' ? 'ur' : 'en'
  } catch {
    return 'en'
  }
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem('lang', lang)
  } catch {
    /* ignore */
  }
}