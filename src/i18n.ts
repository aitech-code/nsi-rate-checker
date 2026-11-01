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
    searchHint: 'Type or paste the NSI item description from your estimate.',
    placeholder: 'e.g. P/F MS flat grill in windows i/c painting 3 coats',
    checkBtn: 'Check in MRS',
    loading: 'Loading MRS data…',
    loadError: 'Could not load MRS data. Check your internet and try again.',
    itemsLoaded: 'active MRS items ready to search',
    strong: 'Strong match — this item is probably already in MRS',
    possible: 'Possible match — compare the description yourself',
    none: 'No close match — this is probably a genuine Non-Schedule Item',
    match: 'match',
    labour: 'Labour',
    composite: 'Composite rate',
    metric: 'Metric',
    page: 'PDF page',
    spec: 'Spec No.',
    chapter: 'Chapter',
    deleted: 'Deleted in MRS',
    showDeleted: 'Also show deleted items',
    disclaimer: 'Results are a guide. Before deciding, compare the full description and specification with the official MRS book.',
    districtNote: 'Rates are Peshawar base rates. Apply your district location factor.',
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
    searchHint: 'اپنے تخمینے سے این ایس آئی آئٹم کی تفصیل یہاں لکھیں یا پیسٹ کریں۔',
    placeholder: 'مثال: P/F MS flat grill in windows i/c painting 3 coats',
    checkBtn: 'ایم آر ایس میں تلاش کریں',
    loading: 'ایم آر ایس ڈیٹا لوڈ ہو رہا ہے…',
    loadError: 'ایم آر ایس ڈیٹا لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔',
    itemsLoaded: 'فعال ایم آر ایس آئٹمز تلاش کے لیے تیار ہیں',
    strong: 'مضبوط مماثلت — یہ آئٹم غالباً پہلے سے ایم آر ایس میں موجود ہے',
    possible: 'ممکنہ مماثلت — تفصیل خود ملا کر دیکھیں',
    none: 'کوئی قریبی مماثلت نہیں — یہ غالباً حقیقی نان شیڈول آئٹم ہے',
    match: 'مماثلت',
    labour: 'لیبر',
    composite: 'کمپوزٹ ریٹ',
    metric: 'میٹرک',
    page: 'پی ڈی ایف صفحہ',
    spec: 'اسپیک نمبر',
    chapter: 'باب',
    deleted: 'ایم آر ایس میں حذف شدہ',
    showDeleted: 'حذف شدہ آئٹمز بھی دکھائیں',
    disclaimer: 'یہ نتائج رہنمائی کے لیے ہیں۔ فیصلے سے پہلے مکمل تفصیل اور اسپیسیفکیشن سرکاری ایم آر ایس کتاب سے ضرور ملائیں۔',
    districtNote: 'یہ پشاور کے بنیادی ریٹس ہیں۔ اپنے ضلع کا لوکیشن فیکٹر لگائیں۔',
  },
} as const

export type Text = (typeof text)['en'] | (typeof text)['ur']

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
