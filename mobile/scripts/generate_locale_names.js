import fs from 'fs';
import path from 'path';

const i18nDirArg = process.argv[2];
const i18nDir = path.resolve(i18nDirArg);
const localeNamesMap = {};

const files = fs.readdirSync(i18nDir, { withFileTypes: true })
  .filter(entry =>
    entry.isFile() &&
    entry.name.endsWith('.json') &&
    entry.name !== 'package.json'
  )
  .map(entry => path.join(i18nDir, entry.name));

// Locales not supported by Intl.DisplayNames
const nonIntlLang = [
  { code: 'mfa', name: 'Malay (Pattani)' },
  { code: 'bi', name: 'Bislama' }, // Intl seems to map it on web, but not in Node.js
];

files.forEach(file => {
  const code = path.basename(file, '.json');
  const bcp47Code = convertBCP47(code);
  const isNonIntl = nonIntlLang.find(lang => lang.code === code);

  if (isNonIntl) {
    localeNamesMap[code] = isNonIntl.name;
  } else if (Intl.DisplayNames.supportedLocalesOf(bcp47Code).length > 0) {
    localeNamesMap[code] = capitalize(new Intl.DisplayNames([bcp47Code], { type: 'language' }).of(bcp47Code));
  } else {
    throw new Error(`Unsupported locale: ${code}. Verify that it follows ISO 639-1, ISO 639-2, ISO 639-3 or IETF BCP-47 and that it is supported by Intl.DisplayNames.
      Otherwise add a mapping for the language in mobile/scripts/generate_locale_names.js and in web/src/lib/constants.ts`);
  }
});

// Generate Dart file content
let dartContent = `// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: constant_identifier_names

const Map<String, String> localeNames = {
`;

for (const [code, name] of Object.entries(localeNamesMap)) {
  const escapedName = name
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

  dartContent += `  '${code}': '${escapedName}',\n`;
}

dartContent += '};\n';

if (!fs.existsSync('lib/generated')) {
  fs.mkdirSync('lib/generated', { recursive: true });
}
fs.writeFileSync('lib/generated/locale_names.g.dart', dartContent);

function capitalize(string) {
  return string
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function convertBCP47(code) {
  return code.replace('_', '-');
}
