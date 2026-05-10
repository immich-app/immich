export const UUID_REGEX = /^[\dA-Fa-f]{8}(?:\b-[\dA-Fa-f]{4}){3}\b-[\dA-Fa-f]{12}$/;

export enum AssetAction {
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
  TRASH = 'trash',
  DELETE = 'delete',
  RESTORE = 'restore',
  STACK = 'stack',
  UNSTACK = 'unstack',
  SET_STACK_PRIMARY_ASSET = 'set-stack-primary-asset',
  REMOVE_ASSET_FROM_STACK = 'remove-asset-from-stack',
  SET_VISIBILITY_LOCKED = 'set-visibility-locked',
  SET_VISIBILITY_TIMELINE = 'set-visibility-timeline',
  SET_PERSON_FEATURED_PHOTO = 'set-person-featured-photo',
  RATING = 'rating',
}

export type SharedLinkTab = 'all' | 'album' | 'individual';

export enum ProjectionType {
  EQUIRECTANGULAR = 'EQUIRECTANGULAR',
  CUBEMAP = 'CUBEMAP',
  CUBESTRIP = 'CUBESTRIP',
  EQUIRECTANGULAR_STEREO = 'EQUIRECTANGULAR_STEREO',
  CUBEMAP_STEREO = 'CUBEMAP_STEREO',
  CUBESTRIP_STEREO = 'CUBESTRIP_STEREO',
  CYLINDER = 'CYLINDER',
  NONE = 'NONE',
}

export const dateFormats = {
  album: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  } satisfies Intl.DateTimeFormatOptions,
  settings: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  } satisfies Intl.DateTimeFormatOptions,
};

type MachineLearningModelOption = {
  label: string;
  value: string;
  description: string;
  keywords?: string[];
};

// Frontend snapshot of the supported ML model catalog.
// Model identifiers were taken from machine-learning/immich_ml/models/constants.py,
// CLIP embedding dimensions were taken from server/src/constants.ts, and the release
// dates were copied from the corresponding immich-app Hugging Face model listings/cards.
export const machineLearningClipModelOptions: MachineLearningModelOption[] = [
    { label: 'ViT-gopt-16-SigLIP2-256__webli', value: 'ViT-gopt-16-SigLIP2-256__webli', description: '1536d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-gopt-16-SigLIP2-384__webli', value: 'ViT-gopt-16-SigLIP2-384__webli', description: '1536d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-SO400M-14-SigLIP-384__webli', value: 'ViT-SO400M-14-SigLIP-384__webli', description: '1152d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-SO400M-14-SigLIP2-378__webli', value: 'ViT-SO400M-14-SigLIP2-378__webli', description: '1152d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-SO400M-14-SigLIP2__webli', value: 'ViT-SO400M-14-SigLIP2__webli', description: '1152d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-SO400M-16-SigLIP2-256__webli', value: 'ViT-SO400M-16-SigLIP2-256__webli', description: '1152d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-SO400M-16-SigLIP2-384__webli', value: 'ViT-SO400M-16-SigLIP2-384__webli', description: '1152d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-SO400M-16-SigLIP2-512__webli', value: 'ViT-SO400M-16-SigLIP2-512__webli', description: '1152d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'nllb-clip-large-siglip__mrl', value: 'nllb-clip-large-siglip__mrl', description: '1152d embeddings. Multilingual search model. Released Jul 2024.' },
    { label: 'nllb-clip-large-siglip__v1', value: 'nllb-clip-large-siglip__v1', description: '1152d embeddings. Multilingual search model. Released Dec 2023.' },
    { label: 'RN50__cc12m', value: 'RN50__cc12m', description: '1024d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'RN50__openai', value: 'RN50__openai', description: '1024d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'RN50__yfcc15m', value: 'RN50__yfcc15m', description: '1024d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'RN50x64__openai', value: 'RN50x64__openai', description: '1024d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'ViT-H-14-378-quickgelu__dfn5b', value: 'ViT-H-14-378-quickgelu__dfn5b', description: '1024d embeddings. General-purpose CLIP model. Released Dec 2023.' },
    { label: 'ViT-H-14-quickgelu__dfn5b', value: 'ViT-H-14-quickgelu__dfn5b', description: '1024d embeddings. General-purpose CLIP model. Released Dec 2023.' },
    { label: 'ViT-H-14__laion2b-s32b-b79k', value: 'ViT-H-14__laion2b-s32b-b79k', description: '1024d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-L-16-SigLIP-256__webli', value: 'ViT-L-16-SigLIP-256__webli', description: '1024d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-L-16-SigLIP-384__webli', value: 'ViT-L-16-SigLIP-384__webli', description: '1024d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-L-16-SigLIP2-256__webli', value: 'ViT-L-16-SigLIP2-256__webli', description: '1024d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-L-16-SigLIP2-384__webli', value: 'ViT-L-16-SigLIP2-384__webli', description: '1024d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-L-16-SigLIP2-512__webli', value: 'ViT-L-16-SigLIP2-512__webli', description: '1024d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-g-14__laion2b-s12b-b42k', value: 'ViT-g-14__laion2b-s12b-b42k', description: '1024d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k', value: 'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k', description: '1024d embeddings. Multilingual search model. Released Dec 2023.' },
    { label: 'LABSE-Vit-L-14', value: 'LABSE-Vit-L-14', description: '768d embeddings. Multilingual search model. Released Oct 2023.' },
    { label: 'RN50x16__openai', value: 'RN50x16__openai', description: '768d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'ViT-B-16-SigLIP-256__webli', value: 'ViT-B-16-SigLIP-256__webli', description: '768d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-B-16-SigLIP-384__webli', value: 'ViT-B-16-SigLIP-384__webli', description: '768d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-B-16-SigLIP-512__webli', value: 'ViT-B-16-SigLIP-512__webli', description: '768d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-B-16-SigLIP-i18n-256__webli', value: 'ViT-B-16-SigLIP-i18n-256__webli', description: '768d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-B-16-SigLIP2__webli', value: 'ViT-B-16-SigLIP2__webli', description: '768d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-B-16-SigLIP__webli', value: 'ViT-B-16-SigLIP__webli', description: '768d embeddings. Fast and accurate semantic search model. Released Jul 2024.' },
    { label: 'ViT-B-32-SigLIP2-256__webli', value: 'ViT-B-32-SigLIP2-256__webli', description: '768d embeddings. Newest generation embedding family. Released Mar 2025.' },
    { label: 'ViT-L-14-336__openai', value: 'ViT-L-14-336__openai', description: '768d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-L-14-quickgelu__dfn2b', value: 'ViT-L-14-quickgelu__dfn2b', description: '768d embeddings. General-purpose CLIP model. Released Dec 2023.' },
    { label: 'ViT-L-14__laion2b-s32b-b82k', value: 'ViT-L-14__laion2b-s32b-b82k', description: '768d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-L-14__laion400m_e31', value: 'ViT-L-14__laion400m_e31', description: '768d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-L-14__laion400m_e32', value: 'ViT-L-14__laion400m_e32', description: '768d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-L-14__openai', value: 'ViT-L-14__openai', description: '768d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'XLM-Roberta-Large-Vit-L-14', value: 'XLM-Roberta-Large-Vit-L-14', description: '768d embeddings. Multilingual search model. Released Oct 2023.' },
    { label: 'nllb-clip-base-siglip__mrl', value: 'nllb-clip-base-siglip__mrl', description: '768d embeddings. Multilingual search model. Released Jul 2024.' },
    { label: 'nllb-clip-base-siglip__v1', value: 'nllb-clip-base-siglip__v1', description: '768d embeddings. Multilingual search model. Released Dec 2023.' },
    { label: 'RN50x4__openai', value: 'RN50x4__openai', description: '640d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'ViT-B-16-plus-240__laion400m_e31', value: 'ViT-B-16-plus-240__laion400m_e31', description: '640d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-16-plus-240__laion400m_e32', value: 'ViT-B-16-plus-240__laion400m_e32', description: '640d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'XLM-Roberta-Large-Vit-B-16Plus', value: 'XLM-Roberta-Large-Vit-B-16Plus', description: '640d embeddings. Multilingual search model. Released Oct 2023.' },
    { label: 'RN101__openai', value: 'RN101__openai', description: '512d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'RN101__yfcc15m', value: 'RN101__yfcc15m', description: '512d embeddings. Legacy baseline with broad compatibility. Released Oct 2023.' },
    { label: 'ViT-B-16__laion400m_e31', value: 'ViT-B-16__laion400m_e31', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-16__laion400m_e32', value: 'ViT-B-16__laion400m_e32', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-16__openai', value: 'ViT-B-16__openai', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-32__laion2b-s34b-b79k', value: 'ViT-B-32__laion2b-s34b-b79k', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-32__laion2b_e16', value: 'ViT-B-32__laion2b_e16', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-32__laion400m_e31', value: 'ViT-B-32__laion400m_e31', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-32__laion400m_e32', value: 'ViT-B-32__laion400m_e32', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'ViT-B-32__openai', value: 'ViT-B-32__openai', description: '512d embeddings. General-purpose CLIP model. Released Oct 2023.' },
    { label: 'XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k', value: 'XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k', description: '512d embeddings. Multilingual search model. Released Jul 2024.' },
    { label: 'XLM-Roberta-Large-Vit-B-32', value: 'XLM-Roberta-Large-Vit-B-32', description: '512d embeddings. Multilingual search model. Released Oct 2023.' },
  ];

export const machineLearningFacialRecognitionModelOptions: MachineLearningModelOption[] = [
    { label: 'antelopev2', value: 'antelopev2', description: 'Largest face model with the strongest matching quality. Released Nov 2023.' },
    { label: 'buffalo_l', value: 'buffalo_l', description: 'Large face model with balanced speed and recognition accuracy. Released Nov 2023.' },
    { label: 'buffalo_m', value: 'buffalo_m', description: 'Medium face model for modest hardware. Released Nov 2023.' },
    { label: 'buffalo_s', value: 'buffalo_s', description: 'Smallest face model with the lightest runtime footprint. Released Nov 2023.' },
  ];

export const machineLearningOcrModelOptions: MachineLearningModelOption[] = [
    { label: 'CH__PP-OCRv5_server', value: 'CH__PP-OCRv5_server', description: 'Largest OCR model for Chinese-heavy workloads.' },
    { label: 'PP-OCRv5_server', value: 'PP-OCRv5_server', description: 'Large OCR model tuned for highest quality text extraction.' },
    { label: 'CH__PP-OCRv5_mobile', value: 'CH__PP-OCRv5_mobile', description: 'Medium OCR model for Chinese-heavy workloads.' },
    { label: 'PP-OCRv5_mobile', value: 'PP-OCRv5_mobile', description: 'Medium OCR model and the default general-purpose choice.' },
    { label: 'EL__PP-OCRv5_mobile', value: 'EL__PP-OCRv5_mobile', description: 'Compact Greek and English OCR model.' },
    { label: 'EN__PP-OCRv5_mobile', value: 'EN__PP-OCRv5_mobile', description: 'Compact English OCR model.' },
    { label: 'ESLAV__PP-OCRv5_mobile', value: 'ESLAV__PP-OCRv5_mobile', description: 'Compact East Slavic OCR model.' },
    { label: 'KOREAN__PP-OCRv5_mobile', value: 'KOREAN__PP-OCRv5_mobile', description: 'Compact Korean and English OCR model.' },
    { label: 'LATIN__PP-OCRv5_mobile', value: 'LATIN__PP-OCRv5_mobile', description: 'Compact Latin-script OCR model for broad European language coverage.' },
    { label: 'TH__PP-OCRv5_mobile', value: 'TH__PP-OCRv5_mobile', description: 'Compact Thai and English OCR model.' },
  ];

export enum QueryParameter {
  ACTION = 'action',
  ID = 'id',
  IS_OPEN = 'isOpen',
  OPEN_SETTING = 'openSetting',
  PREVIOUS_ROUTE = 'previousRoute',
  QUERY = 'query',
  SEARCHED_PEOPLE = 'searchedPeople',
  SMART_SEARCH = 'smartSearch',
  PAGE = 'page',
  PATH = 'path',
}

export enum SessionStorageKey {
  INFINITE_SCROLL_PAGE = 'infiniteScrollPage',
  SCROLL_POSITION = 'scrollPosition',
}

// TODO split into user settings vs system settings
export enum OpenQueryParam {
  OAUTH = 'oauth',
  JOB = 'job',
  STORAGE_TEMPLATE = 'storage-template',
  NOTIFICATIONS = 'notifications',
  PURCHASE_SETTINGS = 'user-purchase-settings',
}

export const maximumLengthSearchPeople = 1000;

// time to load the map before displaying the loading spinner
export const timeToLoadTheMap: number = 100;

export const timeBeforeShowLoadingSpinner: number = 100;

export const timeDebounceOnSearch: number = 300;

export const fallbackLocale = {
  code: 'en-US',
  name: 'English (US)',
};

export enum QueryType {
  SMART = 'smart',
  METADATA = 'metadata',
  DESCRIPTION = 'description',
  FULL_PATH = 'fullPath',
  OCR = 'ocr',
}

export const validQueryTypes = new Set([
  QueryType.SMART,
  QueryType.METADATA,
  QueryType.DESCRIPTION,
  QueryType.FULL_PATH,
  QueryType.OCR,
]);

export const locales = [
  { code: 'af-ZA', name: 'Afrikaans (South Africa)' },
  { code: 'sq-AL', name: 'Albanian (Albania)' },
  { code: 'ar-DZ', name: 'Arabic (Algeria)' },
  { code: 'ar-BH', name: 'Arabic (Bahrain)' },
  { code: 'ar-EG', name: 'Arabic (Egypt)' },
  { code: 'ar-IQ', name: 'Arabic (Iraq)' },
  { code: 'ar-JO', name: 'Arabic (Jordan)' },
  { code: 'ar-KW', name: 'Arabic (Kuwait)' },
  { code: 'ar-LB', name: 'Arabic (Lebanon)' },
  { code: 'ar-LY', name: 'Arabic (Libya)' },
  { code: 'ar-MA', name: 'Arabic (Morocco)' },
  { code: 'ar-OM', name: 'Arabic (Oman)' },
  { code: 'ar-QA', name: 'Arabic (Qatar)' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'ar-SY', name: 'Arabic (Syria)' },
  { code: 'ar-TN', name: 'Arabic (Tunisia)' },
  { code: 'ar-AE', name: 'Arabic (United Arab Emirates)' },
  { code: 'ar-YE', name: 'Arabic (Yemen)' },
  { code: 'hy-AM', name: 'Armenian (Armenia)' },
  { code: 'az-AZ', name: 'Azerbaijani (Azerbaijan)' },
  { code: 'eu-ES', name: 'Basque (Spain)' },
  { code: 'be-BY', name: 'Belarusian (Belarus)' },
  { code: 'bn-IN', name: 'Bengali (India)' },
  { code: 'bs-BA', name: 'Bosnian (Bosnia and Herzegovina)' },
  { code: 'bg-BG', name: 'Bulgarian (Bulgaria)' },
  { code: 'ca-ES', name: 'Catalan (Spain)' },
  { code: 'zh-CN', name: 'Chinese (China)' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong SAR China)' },
  { code: 'zh-MO', name: 'Chinese (Macao SAR China)' },
  { code: 'zh-SG', name: 'Chinese (Singapore)' },
  { code: 'zh-TW', name: 'Chinese (Taiwan)' },
  { code: 'hr-HR', name: 'Croatian (Croatia)' },
  { code: 'cs-CZ', name: 'Czech (Czech Republic)' },
  { code: 'da-DK', name: 'Danish (Denmark)' },
  { code: 'nl-BE', name: 'Dutch (Belgium)' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'en-BZ', name: 'English (Belize)' },
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'en-IE', name: 'English (Ireland)' },
  { code: 'en-JM', name: 'English (Jamaica)' },
  { code: 'en-NZ', name: 'English (New Zealand)' },
  { code: 'en-PH', name: 'English (Philippines)' },
  { code: 'en-ZA', name: 'English (South Africa)' },
  { code: 'en-TT', name: 'English (Trinidad and Tobago)' },
  { code: 'en-VI', name: 'English (U.S. Virgin Islands)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-ZW', name: 'English (Zimbabwe)' },
  { code: 'et-EE', name: 'Estonian (Estonia)' },
  { code: 'fo-FO', name: 'Faroese (Faroe Islands)' },
  { code: 'fi-FI', name: 'Finnish (Finland)' },
  { code: 'fr-BE', name: 'French (Belgium)' },
  { code: 'fr-CA', name: 'French (Canada)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'fr-LU', name: 'French (Luxembourg)' },
  { code: 'fr-MC', name: 'French (Monaco)' },
  { code: 'fr-CH', name: 'French (Switzerland)' },
  { code: 'gl-ES', name: 'Galician (Spain)' },
  { code: 'ka-GE', name: 'Georgian (Georgia)' },
  { code: 'de-AT', name: 'German (Austria)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'de-LI', name: 'German (Liechtenstein)' },
  { code: 'de-LU', name: 'German (Luxembourg)' },
  { code: 'de-CH', name: 'German (Switzerland)' },
  { code: 'el-GR', name: 'Greek (Greece)' },
  { code: 'gu-IN', name: 'Gujarati (India)' },
  { code: 'he-IL', name: 'Hebrew (Israel)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'hu-HU', name: 'Hungarian (Hungary)' },
  { code: 'is-IS', name: 'Icelandic (Iceland)' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'it-CH', name: 'Italian (Switzerland)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'kn-IN', name: 'Kannada (India)' },
  { code: 'kk-KZ', name: 'Kazakh (Kazakhstan)' },
  { code: 'kok-IN', name: 'Konkani (India)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'lv-LV', name: 'Latvian (Latvia)' },
  { code: 'lt-LT', name: 'Lithuanian (Lithuania)' },
  { code: 'mk-MK', name: 'Macedonian (Macedonia)' },
  { code: 'ms-BN', name: 'Malay (Brunei)' },
  { code: 'ms-MY', name: 'Malay (Malaysia)' },
  { code: 'ml-IN', name: 'Malayalam (India)' },
  { code: 'mt-MT', name: 'Maltese (Malta)' },
  { code: 'mr-IN', name: 'Marathi (India)' },
  { code: 'mn-MN', name: 'Mongolian (Mongolia)' },
  { code: 'se-NO', name: 'Northern Sami (Norway)' },
  { code: 'nb-NO', name: 'Norwegian Bokmål (Norway)' },
  { code: 'nn-NO', name: 'Norwegian Nynorsk (Norway)' },
  { code: 'fa-IR', name: 'Persian (Iran)' },
  { code: 'pl-PL', name: 'Polish (Poland)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'pa-IN', name: 'Punjabi (India)' },
  { code: 'ro-RO', name: 'Romanian (Romania)' },
  { code: 'ru-RU', name: 'Russian (Russia)' },
  { code: 'sr-BA', name: 'Serbian (Bosnia and Herzegovina)' },
  { code: 'sr-CS', name: 'Serbian (Serbia And Montenegro)' },
  { code: 'sk-SK', name: 'Slovak (Slovakia)' },
  { code: 'sl-SI', name: 'Slovenian (Slovenia)' },
  { code: 'es-AR', name: 'Spanish (Argentina)' },
  { code: 'es-BO', name: 'Spanish (Bolivia)' },
  { code: 'es-CL', name: 'Spanish (Chile)' },
  { code: 'es-CO', name: 'Spanish (Colombia)' },
  { code: 'es-CR', name: 'Spanish (Costa Rica)' },
  { code: 'es-DO', name: 'Spanish (Dominican Republic)' },
  { code: 'es-EC', name: 'Spanish (Ecuador)' },
  { code: 'es-SV', name: 'Spanish (El Salvador)' },
  { code: 'es-GT', name: 'Spanish (Guatemala)' },
  { code: 'es-HN', name: 'Spanish (Honduras)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'es-NI', name: 'Spanish (Nicaragua)' },
  { code: 'es-PA', name: 'Spanish (Panama)' },
  { code: 'es-PY', name: 'Spanish (Paraguay)' },
  { code: 'es-PE', name: 'Spanish (Peru)' },
  { code: 'es-PR', name: 'Spanish (Puerto Rico)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-UY', name: 'Spanish (Uruguay)' },
  { code: 'es-VE', name: 'Spanish (Venezuela)' },
  { code: 'sw-KE', name: 'Swahili (Kenya)' },
  { code: 'sv-FI', name: 'Swedish (Finland)' },
  { code: 'sv-SE', name: 'Swedish (Sweden)' },
  { code: 'te-IN', name: 'Telugu (India)' },
  { code: 'th-TH', name: 'Thai (Thailand)' },
  { code: 'tn-ZA', name: 'Tswana (South Africa)' },
  { code: 'tr-TR', name: 'Turkish (Turkey)' },
  { code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
  { code: 'uz-UZ', name: 'Uzbek (Uzbekistan)' },
  { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
  { code: 'cy-GB', name: 'Welsh (United Kingdom)' },
  { code: 'xh-ZA', name: 'Xhosa (South Africa)' },
  { code: 'zu-ZA', name: 'Zulu (South Africa)' },
];

export interface Lang {
  name: string;
  code: string;
  loader: () => Promise<{ default: object }>;
  rtl?: boolean;
}

export const defaultLang: Lang = { name: 'English', code: 'en', loader: () => import('$i18n/en.json') };

export enum ImmichProduct {
  Client = 'immich-client',
  Server = 'immich-server',
}

export enum SettingInputFieldType {
  EMAIL = 'email',
  TEXT = 'text',
  NUMBER = 'number',
  PASSWORD = 'password',
  COLOR = 'color',
}

export const AlbumPageViewMode = {
  SELECT_THUMBNAIL: 'select-thumbnail',
  SELECT_ASSETS: 'select-assets',
  VIEW: 'view',
  OPTIONS: 'options',
};

export type AlbumPageViewMode =
  | typeof AlbumPageViewMode.SELECT_THUMBNAIL
  | typeof AlbumPageViewMode.SELECT_ASSETS
  | typeof AlbumPageViewMode.VIEW
  | typeof AlbumPageViewMode.OPTIONS;

export enum PersonPageViewMode {
  VIEW_ASSETS = 'view-assets',
  SELECT_PERSON = 'select-person',
  MERGE_PEOPLE = 'merge-people',
  UNASSIGN_ASSETS = 'unassign-faces',
}

export enum MediaType {
  All = 'all',
  Image = 'image',
  Video = 'video',
}

export enum ProgressBarStatus {
  Playing = 'playing',
  Paused = 'paused',
}

export enum ToggleVisibility {
  HIDE_ALL = 'hide-all',
  HIDE_UNNANEMD = 'hide-unnamed',
  SHOW_ALL = 'show-all',
}

export enum BackupFileStatus {
  OK,
  DifferentVersion,
  UnknownVersion,
}

export const assetViewerFadeDuration: number = 150;
