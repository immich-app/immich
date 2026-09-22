import { defineConfig } from '@eloqnt/cli';

export default defineConfig({
  messages: {
    path: './i18n/{code}',
    locales: 'infer',
    sourceLocale: 'en',
    format: 'json',
    codes: {
      'de-CH': 'de_CH',
      'en-GB': 'en_GB',
      'nb-NO': 'nb_NO',
      'pt-BR': 'pt_BR',
      'sr-Cyrl': 'sr_Cyrl',
      'sr-Latn': 'sr_Latn',
      'yue-Hant': 'yue_Hant',
      'zh-Hans': 'zh_Hans',
      'zh-Hant': 'zh_Hant',
    },
  },
  lint: {
    overrides: [
      {
        // Northern Khmer, Pattani Malay and Swabian have no CLDR locale data
        locales: ['kxm', 'mfa', 'swg'],
        rules: { 'invalid-locale': 'off' },
      },
    ],
  },
});
