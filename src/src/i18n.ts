// All app text in English and Urdu. Add new words here, never inside components.
export type Lang = 'en' | 'ur'

export const text = {
  en: {
    appName: 'NSI Rate Checker',
    subtitle: 'C&W Department, Khyber Pakhtunkhwa',
    switchTo: 'اردو',
    step1: 'Is this item already in MRS?',
    step2: 'Is the rate reasonable as per market?',
    step3: 'Correct the item nomenclature',
    step4: 'Prepare rate analysis (MRS format)',
    comingSoon: 'Coming in next phases',
    dataNote: 'Data source: MRS-2025 (1st Bi-Annual), Finance Department, Govt. of Khyber Pakhtunkhwa',
    install: 'Tip: use your browser menu → "Install app" / "Add to Home screen".',
  },
  ur: {
    appName: 'این ایس آئی ریٹ چیکر',
    subtitle: 'سی اینڈ ڈبلیو ڈیپارٹمنٹ، خیبر پختونخوا',
    switchTo: 'English',
    step1: 'کیا یہ آئٹم پہلے سے ایم آر ایس میں موجود ہے؟',
    step2: 'کیا ریٹ مارکیٹ کے مطابق مناسب ہے؟',
    step3: 'آئٹم کی درست نام بندی (نومنکلیچر)',
    step4: 'ریٹ اینالیسس تیار کریں (ایم آر ایس فارمیٹ)',
    comingSoon: 'اگلے مراحل میں دستیاب ہوگا',
    dataNote: 'ڈیٹا کا ماخذ: ایم آر ایس 2025 (پہلا ششماہی)، محکمہ خزانہ، حکومت خیبر پختونخوا',
    install: 'مشورہ: براؤزر مینو میں "Install app" یا "Add to Home screen" دبائیں۔',
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