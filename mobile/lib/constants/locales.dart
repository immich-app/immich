import 'dart:ui';

const List<Locale> locales = [
  // Default locale
  Locale('en', 'US'),
  // Additional locales
  Locale('ar', 'JO'), // Arabic (Jordan)
  Locale('ca', 'CA'), // Catalan
  Locale('cs', 'CZ'), // Czech
  Locale('da', 'DK'), // Danish
  Locale('de', 'DE'), // German
  Locale('el', 'GR'), // Greek (GR)
  Locale('es', 'ES'), // Spanish (ES)
  Locale('es', 'MX'), // Spanish (MX)
  Locale('es', 'PE'), // Spanish (PE)
  Locale('es', 'US'), // Spanish (US)
  Locale('fi', 'FI'), // Finnish
  Locale('fr', 'CA'), // French (CA)
  Locale('fr', 'FR'), // French
  Locale('he', 'IL'), // Hebrew (IL)
  Locale('hi', 'IN'), // Hindi
  Locale('hu', 'HU'), // Hungarian
  Locale('it', 'IT'), // Italian
  Locale('ja', 'JP'), // Japanese
  Locale('ko', 'KR'), // Korean
  Locale('lt', 'LT'), // Lithuanian
  Locale('lv', 'LV'), // Latvian
  Locale('mn', 'MN'), // Mongolian
  Locale('nb', 'NO'), // Norwegian Bokmål
  Locale('nl', 'NL'), // Dutch
  Locale('pl', 'PL'), // Polish
  Locale('pt', 'PT'), // Portuguese
  Locale('ro', 'RO'), // Romanian (RO)
  Locale('ru', 'RU'), // Russian
  Locale('sk', 'SK'), // Slovak
  Locale('sl', 'SI'), // Slovenian
  Locale('sr', 'Cyrl'), // Serbian Cyrillic
  Locale('sr', 'Latn'), // Serbian Latin
  Locale('sv', 'FI'), // Swedish (FI)
  Locale('sv', 'SE'), // Swedish (SE)
  Locale('th', 'TH'), // Thai (TH)
  Locale('uk', 'UA'), // Ukrainian (UA)
  Locale('vi', 'VN'), // Vietnamese (VN)
  Locale('zh', 'CN'), // Chinese (CN)
  Locale('zh', 'Hans'), // Chinese Simplified
];

const List<Map<String, Locale>> localeWithLanguageName = [
  // Default locale
  {'English (US)': Locale('en', 'US')},
  // Additional locales
  {'Arabic (Jordan)': Locale('ar', 'JO')},
  {'Catalan': Locale('ca', 'CA')},
  {'Chinese (CN)': Locale('zh', 'CN')},
  {'Chinese Simplified': Locale('zh', 'Hans')},
  {'Czech (CZ)': Locale('cs', 'CZ')},
  {'Danish (DK)': Locale('da', 'DK')},
  {'Dutch (NL)': Locale('nl', 'NL')},
  {'Finnish (FI)': Locale('fi', 'FI')},
  {'French (CA)': Locale('fr', 'CA')},
  {'French (FR)': Locale('fr', 'FR')},
  {'German (DE)': Locale('de', 'DE')},
  {'Greek (GR)': Locale('el', 'GR')},
  {'Hebrew (IL)': Locale('he', 'IL')},
  {'Hindi (IN)': Locale('hi', 'IN')},
  {'Hungarian (HU)': Locale('hu', 'HU')},
  {'Italian (IT)': Locale('it', 'IT')},
  {'Japanese (JP)': Locale('ja', 'JP')},
  {'Korean (KR)': Locale('ko', 'KR')},
  {'Latvian (LV)': Locale('lv', 'LV')},
  {'Lithuanian (LT)': Locale('lt', 'LT')},
  {'Mongolian': Locale('mn', 'MN')},
  {'Norwegian Bokmål (NO)': Locale('nb', 'NO')},
  {'Polish (PL)': Locale('pl', 'PL')},
  {'Portuguese (PT)': Locale('pt', 'PT')},
  {'Romanian (RO)': Locale('ro', 'RO')},
  {'Russian (RU)': Locale('ru', 'RU')},
  {'Serbian Cyrillic': Locale('sr', 'Cyrl')},
  {'Serbian Latin': Locale('sr', 'Latn')},
  {'Slovak (SK)': Locale('sk', 'SK')},
  {'Slovenian (SI)': Locale('sl', 'SI')},
  {'Spanish (ES)': Locale('es', 'ES')},
  {'Spanish (MX)': Locale('es', 'MX')},
  {'Spanish (PE)': Locale('es', 'PE')},
  {'Spanish (US)': Locale('es', 'US')},
  {'Swedish (FI)': Locale('sv', 'FI')},
  {'Swedish (SE)': Locale('sv', 'SE')},
  {'Thai (TH)': Locale('th', 'TH')},
  {'Ukrainian (UA)': Locale('uk', 'UA')},
  {'Vietnamese (VN)': Locale('vi', 'VN')},
];

const String translationsPath = 'assets/i18n';
