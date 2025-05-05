import 'dart:ui';

const Map<String, Locale> locales = {
  // Default locale
  'English (en)': Locale('en'),
  // Additional locales
  'Arabic (ar)': Locale('ar'),
  'Catalan (ca)': Locale('ca'),
  'Chinese Simplified (zh_CN)': Locale('zh', 'SIMPLIFIED'),
  'Chinese Traditional (zh_TW)': Locale('zh', 'Hant'),
  'Czech (cs)': Locale('cs'),
  'Danish (da)': Locale('da'),
  'Dutch (nl)': Locale('nl'),
  'Finnish (fi)': Locale('fi'),
  'French (fr)': Locale('fr'),
  'Galician (gl)': Locale('gl'),
  'German (de)': Locale('de'),
  'Greek (el)': Locale('el'),
  'Hebrew (he)': Locale('he'),
  'Hindi (hi)': Locale('hi'),
  'Hungarian (hu)': Locale('hu'),
  'Indonesian (id)': Locale('id'),
  'Italian (it)': Locale('it'),
  'Japanese (ja)': Locale('ja'),
  'Korean (ko)': Locale('ko'),
  'Latvian (lv)': Locale('lv'),
  'Lithuanian (lt)': Locale('lt'),
  'Mongolian (mn)': Locale('mn'),
  'Norwegian Bokmål (nb_NO)': Locale('nb', 'NO'),
  'Polish (pl)': Locale('pl'),
  'Portuguese (pt)': Locale('pt'),
  'Romanian (ro)': Locale('ro'),
  'Russian (ru)': Locale('ru'),
  'Serbian Cyrillic (sr_Cyrl)': Locale('sr', 'Cyrl'),
  'Serbian Latin (sr_Latn)': Locale('sr', 'Latn'),
  'Slovak (sk)': Locale('sk'),
  'Slovenian (sl)': Locale('sl'),
  'Spanish (es)': Locale('es'),
  'Thai (th)': Locale('th'),
  'Turkish (tr)': Locale('tr'),
  'Ukrainian (uk)': Locale('uk'),
  'Vietnamese (vi)': Locale('vi'),
};

const String translationsPath = 'assets/i18n';

const List<Locale> localesNotSupportedByOverpass = [
  Locale('el', 'GR'),
  Locale('sr', 'Cyrl'),
];
