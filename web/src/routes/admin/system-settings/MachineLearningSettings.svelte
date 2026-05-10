<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingCombobox from './SettingCombobox.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import type { ComboBoxOption } from '$lib/components/shared-components/Combobox.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Button, IconButton } from '@immich/ui';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type HuggingFaceModel = {
    id?: string;
    modelId?: string;
    createdAt?: string;
    lastModified?: string;
    downloads?: number;
  };

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
  let isRefreshingModelOptions = $state(false);
  let isHfConnected = $state(false);

  let clipModelOptions = $state<ComboBoxOption[]>([]);
  let facialRecognitionModelOptions = $state<ComboBoxOption[]>([]);
  let ocrModelOptions = $state<ComboBoxOption[]>([]);

  const CLIP_MODEL_DIMENSIONS: Record<string, number> = {
    RN101__openai: 512,
    RN101__yfcc15m: 512,
    'ViT-B-16__laion400m_e31': 512,
    'ViT-B-16__laion400m_e32': 512,
    'ViT-B-16__openai': 512,
    'ViT-B-32__laion2b-s34b-b79k': 512,
    'ViT-B-32__laion2b_e16': 512,
    'ViT-B-32__laion400m_e31': 512,
    'ViT-B-32__laion400m_e32': 512,
    'ViT-B-32__openai': 512,
    'XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k': 512,
    'XLM-Roberta-Large-Vit-B-32': 512,
    RN50x4__openai: 640,
    'ViT-B-16-plus-240__laion400m_e31': 640,
    'ViT-B-16-plus-240__laion400m_e32': 640,
    'XLM-Roberta-Large-Vit-B-16Plus': 640,
    'LABSE-Vit-L-14': 768,
    RN50x16__openai: 768,
    'ViT-B-16-SigLIP-256__webli': 768,
    'ViT-B-16-SigLIP-384__webli': 768,
    'ViT-B-16-SigLIP-512__webli': 768,
    'ViT-B-16-SigLIP-i18n-256__webli': 768,
    'ViT-B-16-SigLIP__webli': 768,
    'ViT-L-14-336__openai': 768,
    'ViT-L-14-quickgelu__dfn2b': 768,
    'ViT-L-14__laion2b-s32b-b82k': 768,
    'ViT-L-14__laion400m_e31': 768,
    'ViT-L-14__laion400m_e32': 768,
    'ViT-L-14__openai': 768,
    'XLM-Roberta-Large-Vit-L-14': 768,
    'nllb-clip-base-siglip__mrl': 768,
    'nllb-clip-base-siglip__v1': 768,
    RN50__cc12m: 1024,
    RN50__openai: 1024,
    RN50__yfcc15m: 1024,
    RN50x64__openai: 1024,
    'ViT-H-14-378-quickgelu__dfn5b': 1024,
    'ViT-H-14-quickgelu__dfn5b': 1024,
    'ViT-H-14__laion2b-s32b-b79k': 1024,
    'ViT-L-16-SigLIP-256__webli': 1024,
    'ViT-L-16-SigLIP-384__webli': 1024,
    'ViT-g-14__laion2b-s12b-b42k': 1024,
    'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k': 1024,
    'ViT-SO400M-14-SigLIP-384__webli': 1152,
    'nllb-clip-large-siglip__mrl': 1152,
    'nllb-clip-large-siglip__v1': 1152,
    'ViT-B-16-SigLIP2__webli': 768,
    'ViT-B-32-SigLIP2-256__webli': 768,
    'ViT-L-16-SigLIP2-256__webli': 1024,
    'ViT-L-16-SigLIP2-384__webli': 1024,
    'ViT-L-16-SigLIP2-512__webli': 1024,
    'ViT-SO400M-14-SigLIP2__webli': 1152,
    'ViT-SO400M-14-SigLIP2-378__webli': 1152,
    'ViT-SO400M-16-SigLIP2-256__webli': 1152,
    'ViT-SO400M-16-SigLIP2-384__webli': 1152,
    'ViT-SO400M-16-SigLIP2-512__webli': 1152,
    'ViT-gopt-16-SigLIP2-256__webli': 1536,
    'ViT-gopt-16-SigLIP2-384__webli': 1536,
  };

  const MODEL_RELEASE_DATES: Record<string, string> = {
    antelopev2: '2023-11-10',
    buffalo_l: '2023-11-10',
    buffalo_l_batch: '2024-06-10',
    buffalo_m: '2023-11-10',
    buffalo_s: '2023-11-10',
    'LABSE-Vit-L-14': '2023-10-28',
    'nllb-clip-base-siglip__mrl': '2024-07-22',
    'nllb-clip-base-siglip__v1': '2023-12-11',
    'nllb-clip-large-siglip__mrl': '2024-07-22',
    'nllb-clip-large-siglip__v1': '2023-12-11',
    'RN101__openai': '2023-10-28',
    'RN101__yfcc15m': '2023-10-28',
    'RN50__cc12m': '2023-10-28',
    'RN50__openai': '2023-10-28',
    'RN50__yfcc15m': '2023-10-28',
    'RN50x16__openai': '2023-10-28',
    'RN50x4__openai': '2023-10-28',
    'RN50x64__openai': '2023-10-28',
    'ViT-B-16__laion400m_e31': '2023-10-28',
    'ViT-B-16__laion400m_e32': '2023-10-28',
    'ViT-B-16__openai': '2023-10-28',
    'ViT-B-16-plus-240__laion400m_e31': '2023-10-28',
    'ViT-B-16-plus-240__laion400m_e32': '2023-10-28',
    'ViT-B-16-SigLIP__webli': '2024-07-22',
    'ViT-B-16-SigLIP-256__webli': '2024-07-22',
    'ViT-B-16-SigLIP-384__webli': '2024-07-22',
    'ViT-B-16-SigLIP-512__webli': '2024-07-22',
    'ViT-B-16-SigLIP-i18n-256__webli': '2024-07-22',
    'ViT-B-16-SigLIP2__webli': '2025-03-12',
    'ViT-B-32__laion2b_e16': '2023-10-28',
    'ViT-B-32__laion2b-s34b-b79k': '2023-10-28',
    'ViT-B-32__laion400m_e31': '2023-10-28',
    'ViT-B-32__laion400m_e32': '2023-10-28',
    'ViT-B-32__openai': '2023-10-28',
    'ViT-B-32-SigLIP2-256__webli': '2025-03-12',
    'ViT-g-14__laion2b-s12b-b42k': '2023-10-28',
    'ViT-gopt-16-SigLIP2-256__webli': '2025-03-13',
    'ViT-gopt-16-SigLIP2-384__webli': '2025-03-13',
    'ViT-H-14__laion2b-s32b-b79k': '2023-10-28',
    'ViT-H-14-378-quickgelu__dfn5b': '2023-12-11',
    'ViT-H-14-quickgelu__dfn5b': '2023-12-11',
    'ViT-L-14__laion2b-s32b-b82k': '2023-10-28',
    'ViT-L-14__laion400m_e31': '2023-10-28',
    'ViT-L-14__laion400m_e32': '2023-10-28',
    'ViT-L-14__openai': '2023-10-28',
    'ViT-L-14-336__openai': '2023-10-28',
    'ViT-L-14-quickgelu__dfn2b': '2023-12-11',
    'ViT-L-16-SigLIP-256__webli': '2024-07-22',
    'ViT-L-16-SigLIP-384__webli': '2024-07-22',
    'ViT-L-16-SigLIP2-256__webli': '2025-03-12',
    'ViT-L-16-SigLIP2-384__webli': '2025-03-13',
    'ViT-L-16-SigLIP2-512__webli': '2025-03-13',
    'ViT-SO400M-14-SigLIP-384__webli': '2024-07-22',
    'ViT-SO400M-14-SigLIP2__webli': '2025-03-13',
    'ViT-SO400M-14-SigLIP2-378__webli': '2025-03-13',
    'ViT-SO400M-16-SigLIP2-256__webli': '2025-03-13',
    'ViT-SO400M-16-SigLIP2-384__webli': '2025-03-13',
    'ViT-SO400M-16-SigLIP2-512__webli': '2025-03-13',
    'XLM-Roberta-Base-ViT-B-32__laion5b_s13b_b90k': '2024-07-22',
    'XLM-Roberta-Large-Vit-B-16Plus': '2023-10-28',
    'XLM-Roberta-Large-Vit-B-32': '2023-10-28',
    'XLM-Roberta-Large-ViT-H-14__frozen_laion5b_s13b_b90k': '2023-12-11',
    'XLM-Roberta-Large-Vit-L-14': '2023-10-28',
  };

  const formatReleaseDate = (date?: string): string => {
    if (!date) {
      return 'Release date unavailable';
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'Release date unavailable';
    }

    return `Released ${new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(parsedDate)}`;
  };

  const getModelReleaseDate = (modelName: string, model?: HuggingFaceModel): string => {
    return model?.createdAt ?? MODEL_RELEASE_DATES[modelName] ?? '';
  };

  const getReleaseSortKey = (date?: string): string => {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toISOString().slice(0, 10);
  };

  const compareModelReleaseDateDesc = (
    left: { modelName: string; model?: HuggingFaceModel },
    right: { modelName: string; model?: HuggingFaceModel },
  ): number => {
    const leftReleaseKey = getReleaseSortKey(getModelReleaseDate(left.modelName, left.model));
    const rightReleaseKey = getReleaseSortKey(getModelReleaseDate(right.modelName, right.model));

    if (leftReleaseKey !== rightReleaseKey) {
      return rightReleaseKey.localeCompare(leftReleaseKey);
    }

    return left.modelName.localeCompare(right.modelName);
  };

  const joinDescriptionParts = (...parts: Array<string | undefined>): string => {
    return parts.filter((part) => Boolean(part)).join(' ');
  };

  const getClipModelValueDescription = (modelName: string, dimSize: number): string => {
    if (modelName.includes('SigLIP2')) {
      return `${dimSize}d, newest generation`;
    }

    if (modelName.includes('XLM') || modelName.includes('nllb') || modelName.includes('LABSE')) {
      return `${dimSize}d, multilingual search`;
    }

    if (modelName.includes('SigLIP')) {
      return `${dimSize}d, fast and accurate`;
    }

    return `${dimSize}d, stable baseline`;
  };

  const getClipModelRecommendation = (modelName: string): string => {
    if (modelName.includes('SigLIP2')) {
      return 'Best for new deployments that want the strongest search quality and the most modern embedding family.';
    }

    if (modelName.includes('XLM') || modelName.includes('nllb') || modelName.includes('LABSE')) {
      return 'Best for multilingual libraries where captions and search terms span multiple languages.';
    }

    if (modelName.includes('SigLIP')) {
      return 'Strong default when you want fast indexing with better semantic search quality than the older CLIP baselines.';
    }

    if (modelName.includes('RN')) {
      return 'Legacy baseline with broad compatibility, useful when you want predictable behavior over newest quality gains.';
    }

    if (modelName.includes('ViT-H') || modelName.includes('ViT-g')) {
      return 'Higher-capacity model family aimed at quality-first search on stronger hardware.';
    }

    return 'Balanced CLIP baseline for semantic search and duplicate detection embeddings.';
  };

  const buildClipDescription = (modelName: string, dimSize: number, model?: HuggingFaceModel): string => {
    return joinDescriptionParts(
      getClipModelValueDescription(modelName, dimSize) + '.',
      getClipModelRecommendation(modelName),
      formatReleaseDate(getModelReleaseDate(modelName, model)) + '.',
    );
  };

  const getClipModelKeywords = (modelName: string): string[] => {
    const keywords = ['clip', 'smart search', 'semantic search'];
    if (modelName.includes('SigLIP2')) {
      keywords.push('siglip2', 'newest');
    }
    if (modelName.includes('SigLIP')) {
      keywords.push('siglip');
    }
    if (modelName.includes('XLM') || modelName.includes('nllb') || modelName.includes('LABSE')) {
      keywords.push('multilingual');
    }
    if (modelName.includes('ViT-H') || modelName.includes('ViT-g')) {
      keywords.push('high accuracy');
    }
    return keywords;
  };

  const CLIP_MODEL_FALLBACK_OPTIONS: ComboBoxOption[] = Object.entries(CLIP_MODEL_DIMENSIONS)
    .map(([modelName, dimSize]) => ({ modelName, model: undefined as HuggingFaceModel | undefined, dimSize }))
    .sort(compareModelReleaseDateDesc)
    .map(({ modelName, dimSize }) => ({
      value: modelName,
      label: modelName,
      description: buildClipDescription(modelName, dimSize),
      keywords: getClipModelKeywords(modelName),
    }));

  const FACIAL_RECOGNITION_FALLBACK_OPTIONS: ComboBoxOption[] = [
    {
      value: 'antelopev2',
      label: 'antelopev2',
      description: joinDescriptionParts(
        'Best face recognition quality with the highest memory use, suited to large libraries and quality-first matching.',
        formatReleaseDate(getModelReleaseDate('antelopev2')) + '.',
      ),
      keywords: ['face', 'recognition', 'highest quality', 'memory'],
    },
    {
      value: 'buffalo_l',
      label: 'buffalo_l',
      description: joinDescriptionParts(
        'High recognition quality with balanced speed. A strong default if you want reliable matching without the heaviest footprint.',
        formatReleaseDate(getModelReleaseDate('buffalo_l')) + '.',
      ),
      keywords: ['face', 'recognition', 'balanced', 'quality'],
    },
    {
      value: 'buffalo_m',
      label: 'buffalo_m',
      description: joinDescriptionParts(
        'Balanced quality and memory footprint. Best for modest hardware that still needs useful face grouping and recognition.',
        formatReleaseDate(getModelReleaseDate('buffalo_m')) + '.',
      ),
      keywords: ['face', 'recognition', 'memory', 'balanced'],
    },
    {
      value: 'buffalo_s',
      label: 'buffalo_s',
      description: joinDescriptionParts(
        'Lowest memory usage and fastest startup, with the biggest tradeoff in recognition quality and matching recall.',
        formatReleaseDate(getModelReleaseDate('buffalo_s')) + '.',
      ),
      keywords: ['face', 'recognition', 'fastest', 'lightweight'],
    },
  ].sort((left, right) => compareModelReleaseDateDesc({ modelName: left.value }, { modelName: right.value }));

  const OCR_MODEL_FALLBACK_OPTIONS: ComboBoxOption[] = [
    {
      value: 'PP-OCRv5_server',
      label: 'PP-OCRv5_server',
      description: joinDescriptionParts(
        'Best OCR quality and layout handling, but also the heaviest compute option. Use when text extraction accuracy matters more than throughput.',
        formatReleaseDate(getModelReleaseDate('PP-OCRv5_server')) + '.',
      ),
      keywords: ['ocr', 'server', 'highest quality'],
    },
    {
      value: 'PP-OCRv5_mobile',
      label: 'PP-OCRv5_mobile',
      description: joinDescriptionParts(
        'Balanced OCR quality and speed. The best default for mixed workloads and general-purpose photo libraries.',
        formatReleaseDate(getModelReleaseDate('PP-OCRv5_mobile')) + '.',
      ),
      keywords: ['ocr', 'mobile', 'balanced'],
    },
    {
      value: 'EN__PP-OCRv5_mobile',
      label: 'EN__PP-OCRv5_mobile',
      description: joinDescriptionParts(
        'English-only OCR and the fastest option when you do not need multilingual text extraction.',
        formatReleaseDate(getModelReleaseDate('EN__PP-OCRv5_mobile')) + '.',
      ),
      keywords: ['ocr', 'english', 'fastest'],
    },
    {
      value: 'EL__PP-OCRv5_mobile',
      label: 'EL__PP-OCRv5_mobile',
      description: joinDescriptionParts('Greek and English OCR model for libraries that mainly need Greek script support.', formatReleaseDate(getModelReleaseDate('EL__PP-OCRv5_mobile')) + '.'),
      keywords: ['ocr', 'greek', 'english'],
    },
    {
      value: 'KOREAN__PP-OCRv5_mobile',
      label: 'KOREAN__PP-OCRv5_mobile',
      description: joinDescriptionParts('Korean and English OCR model for mixed Korean-language collections.', formatReleaseDate(getModelReleaseDate('KOREAN__PP-OCRv5_mobile')) + '.'),
      keywords: ['ocr', 'korean', 'english'],
    },
    {
      value: 'LATIN__PP-OCRv5_mobile',
      label: 'LATIN__PP-OCRv5_mobile',
      description: joinDescriptionParts('Latin-script OCR model for broad European language coverage without the full multilingual overhead.', formatReleaseDate(getModelReleaseDate('LATIN__PP-OCRv5_mobile')) + '.'),
      keywords: ['ocr', 'latin', 'multilingual'],
    },
    {
      value: 'ESLAV__PP-OCRv5_mobile',
      label: 'ESLAV__PP-OCRv5_mobile',
      description: joinDescriptionParts('East Slavic and English OCR model for Cyrillic-heavy libraries.', formatReleaseDate(getModelReleaseDate('ESLAV__PP-OCRv5_mobile')) + '.'),
      keywords: ['ocr', 'slavic', 'english'],
    },
    {
      value: 'TH__PP-OCRv5_mobile',
      label: 'TH__PP-OCRv5_mobile',
      description: joinDescriptionParts('Thai and English OCR model for mixed Thai-language collections.', formatReleaseDate(getModelReleaseDate('TH__PP-OCRv5_mobile')) + '.'),
      keywords: ['ocr', 'thai', 'english'],
    },
  ].sort((left, right) => compareModelReleaseDateDesc({ modelName: left.value }, { modelName: right.value }));

  const getSelectedModelOption = (options: ComboBoxOption[], value: string): ComboBoxOption | undefined => {
    return options.find((option) => option.value === value) ?? (value ? { label: value, value } : undefined);
  };

  const getModelIdentifier = (model: HuggingFaceModel): string | undefined => {
    return model.modelId || model.id;
  };

  const buildClipModelOptionsFromHf = (models: HuggingFaceModel[]): ComboBoxOption[] => {
    return models
      .map((model) => ({ modelName: getModelIdentifier(model)?.replace(/^immich-app\//, ''), model }))
      .filter((entry): entry is { modelName: string; model: HuggingFaceModel } => Boolean(entry.modelName))
      .filter(({ modelName }) => modelName in CLIP_MODEL_DIMENSIONS)
      .sort(compareModelReleaseDateDesc)
      .map(({ modelName, model }) => {
        const dimSize = CLIP_MODEL_DIMENSIONS[modelName] ?? 0;
        return {
          value: modelName,
          label: modelName,
          description: joinDescriptionParts(
            buildClipDescription(modelName, dimSize, model),
            typeof model.downloads === 'number' && model.downloads > 0 ? `${model.downloads.toLocaleString()} downloads on Hugging Face.` : undefined,
          ),
          keywords: getClipModelKeywords(modelName),
        };
      });
  };

  const buildFaceModelOptionsFromHf = (models: HuggingFaceModel[]): ComboBoxOption[] => {
    const releaseDates = new Map(
      models
        .map((model) => [getModelIdentifier(model)?.replace(/^immich-app\//, ''), model.createdAt] as const)
        .filter(([value]) => Boolean(value)),
    );

    return FACIAL_RECOGNITION_FALLBACK_OPTIONS.filter((option) => releaseDates.has(option.value))
      .map((option) => ({
        ...option,
        description: option.description.replace(/Released [A-Za-z]{3} \d{4}|Release date unavailable/, formatReleaseDate(releaseDates.get(option.value) ?? MODEL_RELEASE_DATES[option.value])),
      }))
      .sort((left, right) =>
        compareModelReleaseDateDesc(
          { modelName: left.value, model: { createdAt: releaseDates.get(left.value) } },
          { modelName: right.value, model: { createdAt: releaseDates.get(right.value) } },
        ),
      );
  };

  const buildOcrModelOptionsFromHf = (models: HuggingFaceModel[]): ComboBoxOption[] => {
    const releaseDates = new Map(
      models
        .map((model) => [getModelIdentifier(model)?.replace(/^immich-app\//, ''), model.createdAt] as const)
        .filter(([value]) => Boolean(value)),
    );

    return OCR_MODEL_FALLBACK_OPTIONS.filter((option) => releaseDates.has(option.value))
      .map((option) => ({
        ...option,
        description: option.description.replace(/Released [A-Za-z]{3} \d{4}|Release date unavailable/, formatReleaseDate(releaseDates.get(option.value) ?? MODEL_RELEASE_DATES[option.value])),
      }))
      .sort((left, right) =>
        compareModelReleaseDateDesc(
          { modelName: left.value, model: { createdAt: releaseDates.get(left.value) } },
          { modelName: right.value, model: { createdAt: releaseDates.get(right.value) } },
        ),
      );
  };

  const refreshModelOptionsFromHf = async () => {
    isRefreshingModelOptions = true;

    try {
      const response = await fetch('https://huggingface.co/api/models?author=immich-app&limit=200&full=false');
      if (!response.ok) {
        throw new Error(`Failed to fetch Hugging Face models: ${response.status}`);
      }

      const models = (await response.json()) as HuggingFaceModel[];
      const uniqueModels = Object.values(
        Object.fromEntries(
          models
            .map((model) => [getModelIdentifier(model), model] as const)
            .filter(([identifier]) => Boolean(identifier)),
        ),
      );

      const dynamicClipOptions = buildClipModelOptionsFromHf(uniqueModels);
      const dynamicFaceOptions = buildFaceModelOptionsFromHf(uniqueModels);
      const dynamicOcrOptions = buildOcrModelOptionsFromHf(uniqueModels);

      clipModelOptions = dynamicClipOptions.length > 0 ? dynamicClipOptions : CLIP_MODEL_FALLBACK_OPTIONS;
      facialRecognitionModelOptions =
        dynamicFaceOptions.length > 0 ? dynamicFaceOptions : FACIAL_RECOGNITION_FALLBACK_OPTIONS;
      ocrModelOptions = dynamicOcrOptions.length > 0 ? dynamicOcrOptions : OCR_MODEL_FALLBACK_OPTIONS;
      isHfConnected = true;
    } catch {
      clipModelOptions = CLIP_MODEL_FALLBACK_OPTIONS;
      facialRecognitionModelOptions = FACIAL_RECOGNITION_FALLBACK_OPTIONS;
      ocrModelOptions = OCR_MODEL_FALLBACK_OPTIONS;
      isHfConnected = false;
    } finally {
      isRefreshingModelOptions = false;
    }
  };

  onMount(() => {
    clipModelOptions = CLIP_MODEL_FALLBACK_OPTIONS;
    facialRecognitionModelOptions = FACIAL_RECOGNITION_FALLBACK_OPTIONS;
    ocrModelOptions = OCR_MODEL_FALLBACK_OPTIONS;
    void refreshModelOptionsFromHf();
  });
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" class="mx-4 mt-4" onsubmit={(event) => event.preventDefault()}>
      <div class="flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.machine_learning_enabled')}
          subtitle={$t('admin.machine_learning_enabled_description')}
          {disabled}
          bind:checked={configToEdit.machineLearning.enabled}
        />

        <hr />

        <div>
          {#each configToEdit.machineLearning.urls as _, i (i)}
            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={i === 0 ? $t('url') : undefined}
              description={i === 0 ? $t('admin.machine_learning_url_description') : undefined}
              bind:value={configToEdit.machineLearning.urls[i]}
              required={i === 0}
              disabled={disabled || !configToEdit.machineLearning.enabled}
              isEdited={i === 0 && !isEqual(configToEdit.machineLearning.urls, config.machineLearning.urls)}
            >
              {#snippet trailingSnippet()}
                {#if configToEdit.machineLearning.urls.length > 1}
                  <IconButton
                    aria-label=""
                    onclick={() => configToEdit.machineLearning.urls.splice(i, 1)}
                    icon={mdiTrashCanOutline}
                    color="danger"
                  />
                {/if}
              {/snippet}
            </SettingInputField>
          {/each}
        </div>

        <div class="flex justify-end">
          <Button
            class="mb-2"
            size="small"
            shape="round"
            leadingIcon={mdiPlus}
            onclick={() => configToEdit.machineLearning.urls.push('')}
            disabled={disabled || !configToEdit.machineLearning.enabled}>{$t('add_url')}</Button
          >
        </div>
      </div>

      <SettingAccordion
        key="availability-checks"
        title={$t('admin.machine_learning_availability_checks')}
        subtitle={$t('admin.machine_learning_availability_checks_description')}
      >
        <div class="ms-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_availability_checks_enabled')}
            bind:checked={configToEdit.machineLearning.availabilityChecks.enabled}
            disabled={disabled || !configToEdit.machineLearning.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_availability_checks_interval')}
            bind:value={configToEdit.machineLearning.availabilityChecks.interval}
            description={$t('admin.machine_learning_availability_checks_interval_description')}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.availabilityChecks.enabled}
            isEdited={configToEdit.machineLearning.availabilityChecks.interval !==
              config.machineLearning.availabilityChecks.interval}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_availability_checks_timeout')}
            bind:value={configToEdit.machineLearning.availabilityChecks.timeout}
            description={$t('admin.machine_learning_availability_checks_timeout_description')}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.availabilityChecks.enabled}
            isEdited={configToEdit.machineLearning.availabilityChecks.timeout !==
              config.machineLearning.availabilityChecks.timeout}
          />
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="smart-search"
        title={$t('admin.machine_learning_smart_search')}
        subtitle={$t('admin.machine_learning_smart_search_description')}
      >
        <div class="ms-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_smart_search_enabled')}
            subtitle={$t('admin.machine_learning_smart_search_enabled_description')}
            bind:checked={configToEdit.machineLearning.clip.enabled}
            disabled={disabled || !configToEdit.machineLearning.enabled}
          />

          <hr />

          <SettingCombobox
            title={$t('admin.machine_learning_clip_model')}
            subtitle={isHfConnected
              ? 'Search compatible models by name, dimension, capability, or script. You can also type any custom model name.'
              : 'Hugging Face suggestions are unavailable right now. You can still type any compatible model name manually.'}
            comboboxPlaceholder={isRefreshingModelOptions ? 'Refreshing model list...' : 'Search or enter a CLIP model name'}
            selectedOption={getSelectedModelOption(clipModelOptions, configToEdit.machineLearning.clip.modelName)}
            options={clipModelOptions}
            allowCreate={true}
            defaultFirstOption={true}
            disabled={disabled || isRefreshingModelOptions || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
            onSelect={(option) => {
              configToEdit.machineLearning.clip.modelName = option?.value ?? '';
            }}
            isEdited={configToEdit.machineLearning.clip.modelName !== config.machineLearning.clip.modelName}
          />

          <p class="pb-2 text-sm immich-form-label">
            <FormatMessage key="admin.machine_learning_clip_model_description">
              {#snippet children({ message })}
                <a target="_blank" href="https://huggingface.co/immich-app"><u>{message}</u></a>
              {/snippet}
            </FormatMessage>
          </p>
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="duplicate-detection"
        title={$t('admin.machine_learning_duplicate_detection')}
        subtitle={$t('admin.machine_learning_duplicate_detection_setting_description')}
      >
        <div class="ms-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_duplicate_detection_enabled')}
            subtitle={$t('admin.machine_learning_duplicate_detection_enabled_description')}
            bind:checked={configToEdit.machineLearning.duplicateDetection.enabled}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_max_detection_distance')}
            bind:value={configToEdit.machineLearning.duplicateDetection.maxDistance}
            step="0.0005"
            min={0.001}
            max={0.1}
            description={$t('admin.machine_learning_max_detection_distance_description')}
            disabled={disabled || !featureFlagsManager.value.duplicateDetection}
            isEdited={configToEdit.machineLearning.duplicateDetection.maxDistance !==
              config.machineLearning.duplicateDetection.maxDistance}
          />
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="facial-recognition"
        title={$t('admin.machine_learning_facial_recognition')}
        subtitle={$t('admin.machine_learning_facial_recognition_description')}
      >
        <div class="ms-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_facial_recognition_setting')}
            subtitle={$t('admin.machine_learning_facial_recognition_setting_description')}
            bind:checked={configToEdit.machineLearning.facialRecognition.enabled}
            disabled={disabled || !configToEdit.machineLearning.enabled}
          />

          <hr />

          <SettingCombobox
            title={$t('admin.machine_learning_facial_recognition_model')}
            subtitle={isHfConnected
              ? 'Search by model family, speed, memory footprint, or quality profile. Manual values are still allowed.'
              : 'Suggested face models are unavailable right now. You can still type a compatible model name manually.'}
            comboboxPlaceholder={isRefreshingModelOptions ? 'Refreshing model list...' : 'Search or enter a face model name'}
            selectedOption={getSelectedModelOption(
              facialRecognitionModelOptions,
              configToEdit.machineLearning.facialRecognition.modelName,
            )}
            options={facialRecognitionModelOptions}
            allowCreate={true}
            defaultFirstOption={true}
            disabled={disabled ||
              isRefreshingModelOptions ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            onSelect={(option) => {
              configToEdit.machineLearning.facialRecognition.modelName = option?.value ?? '';
            }}
            isEdited={configToEdit.machineLearning.facialRecognition.modelName !==
              config.machineLearning.facialRecognition.modelName}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_min_detection_score')}
            description={$t('admin.machine_learning_min_detection_score_description')}
            bind:value={configToEdit.machineLearning.facialRecognition.minScore}
            step="0.01"
            min={0.1}
            max={1}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            isEdited={configToEdit.machineLearning.facialRecognition.minScore !==
              config.machineLearning.facialRecognition.minScore}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_max_recognition_distance')}
            description={$t('admin.machine_learning_max_recognition_distance_description')}
            bind:value={configToEdit.machineLearning.facialRecognition.maxDistance}
            step="0.01"
            min={0.1}
            max={2}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            isEdited={configToEdit.machineLearning.facialRecognition.maxDistance !==
              config.machineLearning.facialRecognition.maxDistance}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_min_recognized_faces')}
            description={$t('admin.machine_learning_min_recognized_faces_description')}
            bind:value={configToEdit.machineLearning.facialRecognition.minFaces}
            step="1"
            min={1}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            isEdited={configToEdit.machineLearning.facialRecognition.minFaces !==
              config.machineLearning.facialRecognition.minFaces}
          />
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="ocr"
        title={$t('admin.machine_learning_ocr')}
        subtitle={$t('admin.machine_learning_ocr_description')}
      >
        <div class="mt-4 ml-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_ocr_enabled')}
            subtitle={$t('admin.machine_learning_ocr_enabled_description')}
            bind:checked={configToEdit.machineLearning.ocr.enabled}
            disabled={disabled || !configToEdit.machineLearning.enabled}
          />

          <hr />

          <SettingCombobox
            title={$t('admin.machine_learning_ocr_model')}
            subtitle={isHfConnected
              ? 'Search OCR models by language coverage, speed, or quality. Manual values are also allowed.'
              : 'Suggested OCR models are unavailable right now. You can still type a compatible model name manually.'}
            comboboxPlaceholder={isRefreshingModelOptions ? 'Refreshing model list...' : 'Search or enter an OCR model name'}
            selectedOption={getSelectedModelOption(ocrModelOptions, configToEdit.machineLearning.ocr.modelName)}
            options={ocrModelOptions}
            allowCreate={true}
            defaultFirstOption={true}
            disabled={disabled ||
              isRefreshingModelOptions ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.ocr.enabled}
            onSelect={(option) => {
              configToEdit.machineLearning.ocr.modelName = option?.value ?? '';
            }}
            isEdited={configToEdit.machineLearning.ocr.modelName !== config.machineLearning.ocr.modelName}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_ocr_min_detection_score')}
            description={$t('admin.machine_learning_ocr_min_detection_score_description')}
            bind:value={configToEdit.machineLearning.ocr.minDetectionScore}
            step="0.1"
            min={0.1}
            max={1}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
            isEdited={configToEdit.machineLearning.ocr.minDetectionScore !==
              config.machineLearning.ocr.minDetectionScore}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_ocr_min_recognition_score')}
            description={$t('admin.machine_learning_ocr_min_score_recognition_description')}
            bind:value={configToEdit.machineLearning.ocr.minRecognitionScore}
            step="0.1"
            min={0.1}
            max={1}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
            isEdited={configToEdit.machineLearning.ocr.minRecognitionScore !==
              config.machineLearning.ocr.minRecognitionScore}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_ocr_max_resolution')}
            description={$t('admin.machine_learning_ocr_max_resolution_description')}
            bind:value={configToEdit.machineLearning.ocr.maxResolution}
            min={1}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
            isEdited={configToEdit.machineLearning.ocr.maxResolution !== config.machineLearning.ocr.maxResolution}
          />
        </div>
      </SettingAccordion>
      <SettingButtonsRow bind:configToEdit keys={['machineLearning']} {disabled} />
    </form>
  </div>
</div>
