export const rtlLangs = [
  'ae' /* Avestan */,
  'ar' /* Arabic */,
  'arc' /* Aramaic */,
  'bcc' /* Southern Balochi */,
  'bqi' /* Bakthiari */,
  'ckb' /* Sorani */,
  'dv' /* Dhivehi */,
  'fa' /* Persian */,
  'glk' /* Gilaki */,
  'he' /* Hebrew */,
  'kmr' /* Kurdish (Northern) */,
  'ks' /* Kashmiri */,
  'ku' /* Kurdish */,
  'mzn' /* Mazanderani */,
  'nqo' /* N'Ko */,
  'pnb' /* Western Punjabi */,
  'prs' /* Darī */,
  'ps' /* Pashto */,
  'sd' /* Sindhi */,
  'ur' /* Urdu */,
  'yi' /* Yiddish */,
];

export function isRtlLang(code: string) {
  return rtlLangs.includes(code);
}
