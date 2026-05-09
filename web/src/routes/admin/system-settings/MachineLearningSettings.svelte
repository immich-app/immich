<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/SettingAccordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/SettingInputField.svelte';
  import SettingSelect from './SettingSelect.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/SettingSwitch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
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

  type SelectOption = { value: string; text: string };
  type HuggingFaceModel = { id?: string; modelId?: string };

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
  let isRefreshingModelOptions = $state(false);
  let isHfConnected = $state(false);

  let clipModelOptions = $state<SelectOption[]>([]);
  let facialRecognitionModelOptions = $state<SelectOption[]>([]);
  let ocrModelOptions = $state<SelectOption[]>([]);

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

  const CLIP_MODEL_FALLBACK_OPTIONS: SelectOption[] = Object.entries(CLIP_MODEL_DIMENSIONS).map(([modelName, dimSize]) => ({
    value: modelName,
    text: `${modelName} (${getClipModelValueDescription(modelName, dimSize)})`,
  }));

  const FACIAL_RECOGNITION_FALLBACK_OPTIONS: SelectOption[] = [
    { value: 'antelopev2', text: 'antelopev2 (best quality, highest memory)' },
    { value: 'buffalo_l', text: 'buffalo_l (high quality, balanced speed)' },
    { value: 'buffalo_m', text: 'buffalo_m (balanced quality and memory)' },
    { value: 'buffalo_s', text: 'buffalo_s (lowest memory, fastest startup)' },
  ];

  const OCR_MODEL_FALLBACK_OPTIONS: SelectOption[] = [
    { value: 'PP-OCRv5_server', text: 'PP-OCRv5_server (best OCR quality, highest compute)' },
    { value: 'PP-OCRv5_mobile', text: 'PP-OCRv5_mobile (balanced quality and speed)' },
    { value: 'EN__PP-OCRv5_mobile', text: 'EN__PP-OCRv5_mobile (English-only, fastest option)' },
    { value: 'EL__PP-OCRv5_mobile', text: 'EL__PP-OCRv5_mobile (Greek and English)' },
    { value: 'KOREAN__PP-OCRv5_mobile', text: 'KOREAN__PP-OCRv5_mobile (Korean and English)' },
    { value: 'LATIN__PP-OCRv5_mobile', text: 'LATIN__PP-OCRv5_mobile (Latin script languages)' },
    {
      value: 'ESLAV__PP-OCRv5_mobile',
      text: 'ESLAV__PP-OCRv5_mobile (East Slavic and English)',
    },
    { value: 'TH__PP-OCRv5_mobile', text: 'TH__PP-OCRv5_mobile (Thai and English)' },
  ];

  const getModelIdentifier = (model: HuggingFaceModel): string | undefined => {
    return model.modelId || model.id;
  };

  const buildClipModelOptionsFromHf = (modelIds: string[]): SelectOption[] => {
    return modelIds
      .filter((id) => id in CLIP_MODEL_DIMENSIONS)
      .sort((left, right) => left.localeCompare(right))
      .map((modelName) => {
        const dimSize = CLIP_MODEL_DIMENSIONS[modelName] ?? 0;
        return {
          value: modelName,
          text: `${modelName} (${getClipModelValueDescription(modelName, dimSize)})`,
        };
      });
  };

  const buildFaceModelOptionsFromHf = (modelIds: string[]): SelectOption[] => {
    return FACIAL_RECOGNITION_FALLBACK_OPTIONS.filter((option) => modelIds.includes(option.value));
  };

  const buildOcrModelOptionsFromHf = (modelIds: string[]): SelectOption[] => {
    return OCR_MODEL_FALLBACK_OPTIONS.filter((option) => modelIds.includes(option.value));
  };

  const refreshModelOptionsFromHf = async () => {
    isRefreshingModelOptions = true;

    try {
      const response = await fetch('https://huggingface.co/api/models?author=immich-app&limit=200&full=false');
      if (!response.ok) {
        throw new Error(`Failed to fetch Hugging Face models: ${response.status}`);
      }

      const models = (await response.json()) as HuggingFaceModel[];
      const modelIds = models
        .map(getModelIdentifier)
        .filter((id): id is string => Boolean(id))
        .map((id) => id.replace(/^immich-app\//, ''));

      const uniqueModelIds = [...new Set(modelIds)];

      const dynamicClipOptions = buildClipModelOptionsFromHf(uniqueModelIds);
      const dynamicFaceOptions = buildFaceModelOptionsFromHf(uniqueModelIds);
      const dynamicOcrOptions = buildOcrModelOptionsFromHf(uniqueModelIds);

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

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label={$t('admin.machine_learning_clip_model')}
            bind:value={configToEdit.machineLearning.clip.modelName}
            description={$t('admin.machine_learning_clip_model_description')}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
            isEdited={configToEdit.machineLearning.clip.modelName !== config.machineLearning.clip.modelName}
          />

          {#if isHfConnected}
            <SettingSelect
              label={$t('admin.machine_learning_clip_model')}
              desc={''}
              name="clip-model-select"
              value={configToEdit.machineLearning.clip.modelName}
              options={clipModelOptions}
              disabled={disabled || isRefreshingModelOptions || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
              onSelect={(value) => {
                if (typeof value === 'string') {
                  configToEdit.machineLearning.clip.modelName = value;
                }
              }}
              isEdited={configToEdit.machineLearning.clip.modelName !== config.machineLearning.clip.modelName}
            />
          {/if}

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

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label={$t('admin.machine_learning_facial_recognition_model')}
            description={$t('admin.machine_learning_facial_recognition_model_description')}
            bind:value={configToEdit.machineLearning.facialRecognition.modelName}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            isEdited={configToEdit.machineLearning.facialRecognition.modelName !==
              config.machineLearning.facialRecognition.modelName}
          />

          {#if isHfConnected}
            <SettingSelect
              label={$t('admin.machine_learning_facial_recognition_model')}
              desc={''}
              name="facial-recognition-model-select"
              value={configToEdit.machineLearning.facialRecognition.modelName}
              options={facialRecognitionModelOptions}
              disabled={disabled ||
                isRefreshingModelOptions ||
                !configToEdit.machineLearning.enabled ||
                !configToEdit.machineLearning.facialRecognition.enabled}
              onSelect={(value) => {
                if (typeof value === 'string') {
                  configToEdit.machineLearning.facialRecognition.modelName = value;
                }
              }}
              isEdited={configToEdit.machineLearning.facialRecognition.modelName !==
                config.machineLearning.facialRecognition.modelName}
            />
          {/if}

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

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label={$t('admin.machine_learning_ocr_model')}
            description={$t('admin.machine_learning_ocr_model_description')}
            bind:value={configToEdit.machineLearning.ocr.modelName}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
            isEdited={configToEdit.machineLearning.ocr.modelName !== config.machineLearning.ocr.modelName}
          />

          {#if isHfConnected}
            <SettingSelect
              label={$t('admin.machine_learning_ocr_model')}
              desc={''}
              name="ocr-model-select"
              value={configToEdit.machineLearning.ocr.modelName}
              options={ocrModelOptions}
              disabled={disabled ||
                isRefreshingModelOptions ||
                !configToEdit.machineLearning.enabled ||
                !configToEdit.machineLearning.ocr.enabled}
              onSelect={(value) => {
                if (typeof value === 'string') {
                  configToEdit.machineLearning.ocr.modelName = value;
                }
              }}
              isEdited={configToEdit.machineLearning.ocr.modelName !== config.machineLearning.ocr.modelName}
            />
          {/if}

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
