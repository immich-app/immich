<script lang="ts">
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { Button, IconButton } from '@immich/ui';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());

  /** Video sampling fractions must stay within server/API bounds (open interval 0, 1). */
  const MIN_SAMPLING_FRAC = 0.000001;
  const MAX_SAMPLING_FRAC = 0.999999;

  function clampSamplingFraction(n: number): number {
    return Math.min(MAX_SAMPLING_FRAC, Math.max(MIN_SAMPLING_FRAC, n));
  }

  function setVideoSamplingPreset(fractions: number[]): void {
    configToEdit.machineLearning.videoSampling.strategy = 'fractions';
    configToEdit.machineLearning.videoSampling.samplingFractions = fractions.map(clampSamplingFraction);
  }

  function setUniformFramePreset(count: number): void {
    configToEdit.machineLearning.videoSampling.strategy = 'uniformCount';
    configToEdit.machineLearning.videoSampling.uniformFrameCount = count;
  }

  function setFixedStepPreset(step: number): void {
    configToEdit.machineLearning.videoSampling.strategy = 'fixedStep';
    configToEdit.machineLearning.videoSampling.fractionStep = step;
  }

  const videoSamplingEdited = $derived(
    !isEqual(configToEdit.machineLearning.videoSampling, config.machineLearning.videoSampling),
  );

  /** Human-friendly percent for the hint line (avoids long tails on common values). */
  function formatSamplingPercentHint(fraction: number): string {
    const pct = fraction * 100;
    const abs = Math.abs(pct);
    const maxFrac = abs >= 10 && abs < 99.999 ? 2 : 6;
    return pct.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
  }
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
        key="video-sampling"
        title={$t('admin.machine_learning_video_sampling')}
        subtitle={$t('admin.machine_learning_video_sampling_description')}
      >
        <div class="ms-4 mt-4 flex flex-col gap-4">
          <p class="immich-form-label max-w-prose text-sm leading-relaxed">
            {$t('admin.machine_learning_video_sampling_fractions_hint')}
          </p>

          <SettingSelect
            label={$t('admin.machine_learning_video_sampling_strategy')}
            desc={$t('admin.machine_learning_video_sampling_strategy_description')}
            name="video-sampling-strategy"
            bind:value={configToEdit.machineLearning.videoSampling.strategy}
            disabled={disabled || !configToEdit.machineLearning.enabled}
            isEdited={videoSamplingEdited}
            options={[
              { value: 'fractions', text: $t('admin.machine_learning_video_sampling_strategy_fractions') },
              { value: 'uniformCount', text: $t('admin.machine_learning_video_sampling_strategy_uniform') },
              { value: 'fixedStep', text: $t('admin.machine_learning_video_sampling_strategy_fixed_step') },
            ]}
          />

          <SettingSwitch
            title={$t('admin.machine_learning_video_sampling_include_preview')}
            subtitle={$t('admin.machine_learning_video_sampling_include_preview_description')}
            bind:checked={configToEdit.machineLearning.videoSampling.includeAssetPreviewFrame}
            disabled={disabled || !configToEdit.machineLearning.enabled}
            isEdited={videoSamplingEdited}
          />

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium text-primary"
              >{$t('admin.machine_learning_video_sampling_presets')}</span
            >
            <div class="flex flex-wrap gap-2">
              <Button
                size="small"
                shape="round"
                onclick={() => setVideoSamplingPreset([0.25, 0.5, 0.75])}
                disabled={disabled || !configToEdit.machineLearning.enabled}
                >{$t('admin.machine_learning_video_sampling_preset_quarters')}</Button
              >
              <Button
                size="small"
                shape="round"
                onclick={() => setVideoSamplingPreset([1 / 3, 2 / 3])}
                disabled={disabled || !configToEdit.machineLearning.enabled}
                >{$t('admin.machine_learning_video_sampling_preset_thirds')}</Button
              >
              <Button
                size="small"
                shape="round"
                onclick={() => setVideoSamplingPreset([0.5])}
                disabled={disabled || !configToEdit.machineLearning.enabled}
                >{$t('admin.machine_learning_video_sampling_preset_center')}</Button
              >
              <Button
                size="small"
                shape="round"
                onclick={() => setVideoSamplingPreset([0.1, 0.9])}
                disabled={disabled || !configToEdit.machineLearning.enabled}
                >{$t('admin.machine_learning_video_sampling_preset_early_late')}</Button
              >
              <Button
                size="small"
                shape="round"
                onclick={() => setUniformFramePreset(8)}
                disabled={disabled || !configToEdit.machineLearning.enabled}
                >{$t('admin.machine_learning_video_sampling_preset_uniform_8')}</Button
              >
              <Button
                size="small"
                shape="round"
                onclick={() => setFixedStepPreset(0.1)}
                disabled={disabled || !configToEdit.machineLearning.enabled}
                >{$t('admin.machine_learning_video_sampling_preset_step_01')}</Button
              >
            </div>
          </div>

          {#if configToEdit.machineLearning.videoSampling.strategy === 'fractions'}
            {#each configToEdit.machineLearning.videoSampling.samplingFractions as _, i (i)}
              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label={$t('admin.machine_learning_video_sampling_row', { values: { n: i + 1 } })}
                bind:value={configToEdit.machineLearning.videoSampling.samplingFractions[i]}
                step="any"
                min={MIN_SAMPLING_FRAC}
                max={MAX_SAMPLING_FRAC}
                disabled={disabled || !configToEdit.machineLearning.enabled}
                isEdited={videoSamplingEdited}
              >
                {#snippet descriptionSnippet()}
                  <p class="immich-form-label pb-2 text-xs text-muted">
                    {$t('admin.machine_learning_video_sampling_percent_equivalent', {
                      values: {
                        percent: formatSamplingPercentHint(configToEdit.machineLearning.videoSampling.samplingFractions[i]),
                      },
                    })}
                  </p>
                {/snippet}
                {#snippet trailingSnippet()}
                  {#if configToEdit.machineLearning.videoSampling.samplingFractions.length > 1}
                    <IconButton
                      aria-label={$t('remove')}
                      onclick={() => configToEdit.machineLearning.videoSampling.samplingFractions.splice(i, 1)}
                      icon={mdiTrashCanOutline}
                      color="danger"
                    />
                  {/if}
                {/snippet}
              </SettingInputField>
            {/each}
            <div class="flex justify-end">
              <Button
                class="mb-2"
                size="small"
                shape="round"
                leadingIcon={mdiPlus}
                onclick={() => {
                  if (configToEdit.machineLearning.videoSampling.samplingFractions.length < 24) {
                    configToEdit.machineLearning.videoSampling.samplingFractions.push(0.5);
                  }
                }}
                disabled={disabled ||
                  !configToEdit.machineLearning.enabled ||
                  configToEdit.machineLearning.videoSampling.samplingFractions.length >= 24}
                >{$t('add')}</Button
              >
            </div>
          {:else if configToEdit.machineLearning.videoSampling.strategy === 'uniformCount'}
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.machine_learning_video_sampling_uniform_count')}
              description={$t('admin.machine_learning_video_sampling_uniform_count_description')}
              bind:value={configToEdit.machineLearning.videoSampling.uniformFrameCount}
              step="1"
              min={1}
              max={32}
              disabled={disabled || !configToEdit.machineLearning.enabled}
              isEdited={videoSamplingEdited}
            />
          {:else}
            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label={$t('admin.machine_learning_video_sampling_fraction_step')}
              description={$t('admin.machine_learning_video_sampling_fraction_step_description')}
              bind:value={configToEdit.machineLearning.videoSampling.fractionStep}
              step="any"
              min={0.01}
              max={0.5}
              disabled={disabled || !configToEdit.machineLearning.enabled}
              isEdited={videoSamplingEdited}
            />
          {/if}
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
            required={true}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
            isEdited={configToEdit.machineLearning.clip.modelName !== config.machineLearning.clip.modelName}
          >
            {#snippet descriptionSnippet()}
              <p class="immich-form-label pb-2 text-sm">
                <FormatMessage key="admin.machine_learning_clip_model_description">
                  {#snippet children({ message })}
                    <a target="_blank" href="https://huggingface.co/immich-app"><u>{message}</u></a>
                  {/snippet}
                </FormatMessage>
              </p>
            {/snippet}
          </SettingInputField>

          <hr />

          <SettingSwitch
            title={$t('admin.machine_learning_clip_video_multi_frame')}
            subtitle={$t('admin.machine_learning_clip_video_multi_frame_description')}
            bind:checked={configToEdit.machineLearning.clip.videoMultiFrameEncodingEnabled}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.clip.enabled}
            isEdited={configToEdit.machineLearning.clip.videoMultiFrameEncodingEnabled !==
              config.machineLearning.clip.videoMultiFrameEncodingEnabled}
          />
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

          <SettingSwitch
            title={$t('admin.machine_learning_video_multi_frame_face_detection')}
            subtitle={$t('admin.machine_learning_video_multi_frame_face_detection_description')}
            bind:checked={configToEdit.machineLearning.facialRecognition.videoMultiFrameDetectionEnabled}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            isEdited={configToEdit.machineLearning.facialRecognition.videoMultiFrameDetectionEnabled !==
              config.machineLearning.facialRecognition.videoMultiFrameDetectionEnabled}
          />

          <hr />

          <SettingSelect
            label={$t('admin.machine_learning_facial_recognition_model')}
            desc={$t('admin.machine_learning_facial_recognition_model_description')}
            name="facial-recognition-model"
            bind:value={configToEdit.machineLearning.facialRecognition.modelName}
            options={[
              { value: 'antelopev2', text: 'antelopev2' },
              { value: 'buffalo_l', text: 'buffalo_l' },
              { value: 'buffalo_m', text: 'buffalo_m' },
              { value: 'buffalo_s', text: 'buffalo_s' },
            ]}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
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

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_person_thumbnail_size')}
            description={$t('admin.machine_learning_person_thumbnail_size_description')}
            bind:value={configToEdit.machineLearning.facialRecognition.personThumbnailSize}
            step="1"
            min={32}
            max={2048}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            isEdited={configToEdit.machineLearning.facialRecognition.personThumbnailSize !==
              config.machineLearning.facialRecognition.personThumbnailSize}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_person_thumbnail_padding')}
            description={$t('admin.machine_learning_person_thumbnail_padding_description')}
            bind:value={configToEdit.machineLearning.facialRecognition.personThumbnailCropPaddingFactor}
            step="0.01"
            min={1}
            max={2}
            disabled={disabled ||
              !configToEdit.machineLearning.enabled ||
              !configToEdit.machineLearning.facialRecognition.enabled}
            isEdited={configToEdit.machineLearning.facialRecognition.personThumbnailCropPaddingFactor !==
              config.machineLearning.facialRecognition.personThumbnailCropPaddingFactor}
          />
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="ocr"
        title={$t('admin.machine_learning_ocr')}
        subtitle={$t('admin.machine_learning_ocr_description')}
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_ocr_enabled')}
            subtitle={$t('admin.machine_learning_ocr_enabled_description')}
            bind:checked={configToEdit.machineLearning.ocr.enabled}
            disabled={disabled || !configToEdit.machineLearning.enabled}
          />

          <hr />

          <SettingSelect
            label={$t('admin.machine_learning_ocr_model')}
            desc={$t('admin.machine_learning_ocr_model_description')}
            name="ocr-model"
            bind:value={configToEdit.machineLearning.ocr.modelName}
            options={[
              { text: 'PP-OCRv5_server (Chinese, Japanese and English)', value: 'PP-OCRv5_server' },
              { text: 'PP-OCRv5_mobile (Chinese, Japanese and English)', value: 'PP-OCRv5_mobile' },
              { text: 'PP-OCRv5_mobile (English-only)', value: 'EN__PP-OCRv5_mobile' },
              { text: 'PP-OCRv5_mobile (Greek and English)', value: 'EL__PP-OCRv5_mobile' },
              { text: 'PP-OCRv5_mobile (Korean and English)', value: 'KOREAN__PP-OCRv5_mobile' },
              { text: 'PP-OCRv5_mobile (Latin script languages)', value: 'LATIN__PP-OCRv5_mobile' },
              { text: 'PP-OCRv5_mobile (Russian, Belarusian, Ukrainian and English)', value: 'ESLAV__PP-OCRv5_mobile' },
              { text: 'PP-OCRv5_mobile (Thai and English)', value: 'TH__PP-OCRv5_mobile' },
            ]}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.ocr.enabled}
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
