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
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
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
            required={true}
            disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
            isEdited={configToEdit.machineLearning.clip.modelName !== config.machineLearning.clip.modelName}
          >
            {#snippet descriptionSnippet()}
              <p class="pb-2 text-sm immich-form-label">
                <FormatMessage key="admin.machine_learning_clip_model_description">
                  {#snippet children({ message })}
                    <a target="_blank" href="https://huggingface.co/immich-app"><u>{message}</u></a>
                  {/snippet}
                </FormatMessage>
              </p>
            {/snippet}
          </SettingInputField>
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

      <SettingAccordion title={$t('admin.machine_learning_aesthetic_memories_title', { default: 'Aesthetic Memories' })} subtitle={$t('admin.machine_learning_aesthetic_memories_description', { default: 'Dynamic memory cards generation.' })}>
        <div class="flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_aesthetic_memories_enabled', { default: 'Enabled' })}
            subtitle={$t('admin.machine_learning_aesthetic_memories_enabled_description', { default: 'Enable generating aesthetic custom memory cards' })}
            {disabled}
            bind:checked={configToEdit.machineLearning.aestheticMemories.enabled}
          />

          <hr />

          {#each configToEdit.machineLearning.aestheticMemories.customCards as card, i (card.id)}
            <div class="border p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800 relative">
              <div class="absolute right-2 top-2">
                <IconButton aria-label="Delete" onclick={() => configToEdit.machineLearning.aestheticMemories.customCards.splice(i, 1)} icon={mdiTrashCanOutline} color="danger" />
              </div>
              
              <SettingSwitch title="Enabled" subtitle="Enable this memory card" {disabled} bind:checked={card.enabled} />
              
              <SettingInputField inputType={SettingInputFieldType.TEXT} label="Title" description="The title of the memory shown in the UI" required bind:value={card.title} {disabled} isEdited={card.title !== config.machineLearning.aestheticMemories.customCards[i]?.title} />

              <SettingInputField inputType={SettingInputFieldType.TEXT} label="CLIP Prompt" description="The visual criteria to search for" required bind:value={card.clipPrompt} {disabled} isEdited={card.clipPrompt !== config.machineLearning.aestheticMemories.customCards[i]?.clipPrompt} />

              <SettingSelect label="Frequency" description="How often should this be generated?" bind:value={card.frequency} options={[ { text: 'Daily', value: 'daily' }, { text: 'Weekly', value: 'weekly' }, { text: 'Monthly', value: 'monthly' }, { text: 'Yearly', value: 'yearly' } ]} {disabled} isEdited={card.frequency !== config.machineLearning.aestheticMemories.customCards[i]?.frequency} />

              <SettingInputField inputType={SettingInputFieldType.NUMBER} label="Max Photos" description="Maximum number of photos in the memory" required bind:value={card.maxPhotos} min={1} max={100} {disabled} isEdited={card.maxPhotos !== config.machineLearning.aestheticMemories.customCards[i]?.maxPhotos} />
            </div>
          {/each}

          <div class="flex justify-end mt-2">
            <Button
              size="sm"
              {disabled}
              onclick={() => {
                configToEdit.machineLearning.aestheticMemories.customCards = [
                  ...configToEdit.machineLearning.aestheticMemories.customCards,
                  {
                    id: crypto.randomUUID(),
                    title: 'New Memory',
                    clipPrompt: 'beautiful sunset',
                    frequency: 'weekly',
                    maxPhotos: 10,
                    enabled: true,
                  },
                ];
              }}
            >
              {$t('admin.machine_learning_aesthetic_memories_add_card', { default: 'Add Card' })}
            </Button>
          </div>
        </div>
      </SettingAccordion>
      <SettingButtonsRow bind:configToEdit keys={['machineLearning']} {disabled} />
    </form>
  </div>
</div>
