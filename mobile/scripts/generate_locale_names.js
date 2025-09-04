import fs from 'fs';
import path from 'path';

const i18nDirArg = process.argv[2];
const i18nDir = path.resolve(i18nDirArg);
const files = fs.readdirSync(i18nDir);
const mapping = {};

// Locales not supported by Intl.DisplayNames
const nonIntlLang = [
  { code: 'mfa', name: 'Malay (Pattani)' },
  { code: 'bi', name: 'Bislama' }, // Supported but Intl.DisplayNames may not return it
];

files.forEach(file => {
  const code = path.basename(file, '.json');
  const bcp47Code = convertBCP47(code);
  const isNonIntl = nonIntlLang.find(lang => lang.code === code);

  if (isNonIntl) {
    mapping[code] = isNonIntl.name;
  } else if (Intl.DisplayNames.supportedLocalesOf(bcp47Code).length > 0) {
    mapping[code] = capitalize(new Intl.DisplayNames([bcp47Code], { type: 'language' }).of(bcp47Code));
  } else {
    throw new Error(`Unsupported locale: ${code}`);
  }
});

// Generate Dart file content
let dartContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: constant_identifier_names

const Map<String, String> localeNames = {
`;

for (const [code, name] of Object.entries(mapping)) {
  const escapedName = name
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

  dartContent += `  '${code}': '${escapedName}',\n`;
}
// Write Dart file
fs.writeFileSync('lib/generated/locale_names.g.dart', dartContent);

// Helper functions
function capitalize(string) {
  return string
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function convertBCP47(code) {
  return code.replace('_', '-');
}
