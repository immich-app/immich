import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/locale_names.g.dart';

final Map<String, Locale> locales = {for (final entry in localeNames.entries) entry.value: _parseLocale(entry.key)};

Locale _parseLocale(String code) {
  final parts = code.split('_');
  if (parts.length == 1) {
    return Locale(parts[0]);
  }
  if (parts.length == 2) {
    if (parts[1].length == 2) {
      return Locale(parts[0], parts[1]);
    }
    return Locale.fromSubtags(languageCode: parts[0], scriptCode: parts[1]);
  }
  if (parts.length == 3) {
    return Locale.fromSubtags(languageCode: parts[0], scriptCode: parts[1], countryCode: parts[2]);
  }
  throw ArgumentError('Invalid locale code: $code');
}

const String translationsPath = 'assets/i18n';

const List<Locale> localesNotSupportedByAppFont = [Locale('el', 'GR'), Locale('sr', 'Cyrl')];

final List<Locale> materialSupportedLanguages = [
  const Locale('af'), // Afrikaans
  const Locale('am'), // Amharic
  const Locale('ar'), // Arabic
  const Locale('as'), // Assamese
  const Locale('az'), // Azerbaijani
  const Locale('be'), // Belarusian
  const Locale('bg'), // Bulgarian
  const Locale('bn'), // Bengali
  const Locale('bo'), // Tibetan
  const Locale('bs'), // Bosnian
  const Locale('ca'), // Catalan
  const Locale('cs'), // Czech
  const Locale('cy'), // Welsh
  const Locale('da'), // Danish
  const Locale('de'), // German
  const Locale('de', 'CH'), // German (Switzerland)
  const Locale('el'), // Greek
  const Locale('en'), // English
  const Locale('en', 'AU'), // English (Australia)
  const Locale('en', 'CA'), // English (Canada)
  const Locale('en', 'GB'), // English (United Kingdom)
  const Locale('en', 'IE'), // English (Ireland)
  const Locale('en', 'IN'), // English (India)
  const Locale('en', 'NZ'), // English (New Zealand)
  const Locale('en', 'SG'), // English (Singapore)
  const Locale('en', 'ZA'), // English (South Africa)
  const Locale('es'), // Spanish
  const Locale('es', '419'), // Spanish (Latin America)
  const Locale('es', 'AR'), // Spanish (Argentina)
  const Locale('es', 'BO'), // Spanish (Bolivia)
  const Locale('es', 'CL'), // Spanish (Chile)
  const Locale('es', 'CO'), // Spanish (Colombia)
  const Locale('es', 'CR'), // Spanish (Costa Rica)
  const Locale('es', 'DO'), // Spanish (Dominican Republic)
  const Locale('es', 'EC'), // Spanish (Ecuador)
  const Locale('es', 'GT'), // Spanish (Guatemala)
  const Locale('es', 'HN'), // Spanish (Honduras)
  const Locale('es', 'MX'), // Spanish (Mexico)
  const Locale('es', 'NI'), // Spanish (Nicaragua)
  const Locale('es', 'PA'), // Spanish (Panama)
  const Locale('es', 'PE'), // Spanish (Peru)
  const Locale('es', 'PR'), // Spanish (Puerto Rico)
  const Locale('es', 'PY'), // Spanish (Paraguay)
  const Locale('es', 'SV'), // Spanish (El Salvador)
  const Locale('es', 'US'), // Spanish (United States)
  const Locale('es', 'UY'), // Spanish (Uruguay)
  const Locale('es', 'VE'), // Spanish (Venezuela)
  const Locale('et'), // Estonian
  const Locale('eu'), // Basque
  const Locale('fa'), // Persian
  const Locale('fi'), // Finnish
  const Locale('fil'), // Filipino
  const Locale('fr'), // French
  const Locale('fr', 'CA'), // French (Canada)
  const Locale('ga'), // Irish
  const Locale('gl'), // Galician
  const Locale('gsw'), // Swiss German
  const Locale('gu'), // Gujarati
  const Locale('he'), // Hebrew
  const Locale('hi'), // Hindi
  const Locale('hr'), // Croatian
  const Locale('hu'), // Hungarian
  const Locale('hy'), // Armenian
  const Locale('id'), // Indonesian
  const Locale('is'), // Icelandic
  const Locale('it'), // Italian
  const Locale('ja'), // Japanese
  const Locale('ka'), // Georgian
  const Locale('kk'), // Kazakh
  const Locale('km'), // Khmer
  const Locale('kn'), // Kannada
  const Locale('ko'), // Korean
  const Locale('ky'), // Kyrgyz
  const Locale('lo'), // Lao
  const Locale('lt'), // Lithuanian
  const Locale('lv'), // Latvian
  const Locale('mk'), // Macedonian
  const Locale('ml'), // Malayalam
  const Locale('mn'), // Mongolian
  const Locale('mr'), // Marathi
  const Locale('ms'), // Malay
  const Locale('my'), // Burmese
  const Locale('nb'), // Norwegian Bokmål
  const Locale('nb', 'NO'), // Norwegian Bokmål (Norway)
  const Locale('no'), // Norwegian
  const Locale('ne'), // Nepali
  const Locale('nl'), // Dutch
  const Locale('or'), // Odia
  const Locale('pa'), // Punjabi
  const Locale('pl'), // Polish
  const Locale('ps'), // Pashto
  const Locale('pt'), // Portuguese
  const Locale('pt', 'PT'), // Portuguese (Portugal)
  const Locale('ro'), // Romanian
  const Locale('ru'), // Russian
  const Locale('si'), // Sinhala
  const Locale('sk'), // Slovak
  const Locale('sl'), // Slovenian
  const Locale('sq'), // Albanian
  const Locale.fromSubtags(languageCode: 'sr', scriptCode: 'Cyrl'), // Serbian Cyrillic
  const Locale.fromSubtags(languageCode: 'sr', scriptCode: 'Latn'), // Serbian Latin
  const Locale('sr'), // Serbian
  const Locale('sv'), // Swedish
  const Locale('sw'), // Swahili
  const Locale('ta'), // Tamil
  const Locale('te'), // Telugu
  const Locale('th'), // Thai
  const Locale('tl'), // Tagalog
  const Locale('tr'), // Turkish
  const Locale('ug'), // Uyghur
  const Locale('uk'), // Ukrainian
  const Locale('ur'), // Urdu
  const Locale('uz'), // Uzbek
  const Locale('vi'), // Vietnamese
  const Locale('zh'), // Chinese
  const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hans'), // Chinese Simplified
  const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant'), // Chinese Traditional
  const Locale.fromSubtags(
    languageCode: 'zh',
    scriptCode: 'Hant',
    countryCode: 'HK',
  ), // Chinese Traditional (Hong Kong)
  const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant', countryCode: 'TW'), // Chinese Traditional (Taiwan)
  const Locale('zu'), // Zulu
];
