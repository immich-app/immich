<script lang="ts">
  import SystemSettingsCard from '$lib/components/SystemSettingsCard.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import FormatMessage from '$lib/elements/FormatMessage.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { Button, IconButton } from '@immich/ui';
  import { mdiPlus, mdiTrashCanOutline } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['machineLearning']} size="large">
  {#snippet child({ disabled, config, configToEdit })}
    <div class="flex flex-col gap-4">
      <SettingSwitch
        title={$t('admin.machine_learning_enabled')}
        subtitle={$t('admin.machine_learning_enabled_description')}
        {disabled}
        bind:checked={configToEdit.machineLearning.enabled}
      />

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

      <SystemSettingsCard
        title={$t('admin.machine_learning_availability_checks')}
        subtitle={$t('admin.machine_learning_availability_checks_description')}
      >
        <SettingSwitch
          title={$t('admin.machine_learning_availability_checks_enabled')}
          bind:checked={configToEdit.machineLearning.availabilityChecks.enabled}
          disabled={disabled || !configToEdit.machineLearning.enabled}
        />

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
      </SystemSettingsCard>

      <SystemSettingsCard
        title={$t('admin.machine_learning_smart_search')}
        subtitle={$t('admin.machine_learning_smart_search_description')}
      >
        <SettingSwitch
          title={$t('admin.machine_learning_smart_search_enabled')}
          subtitle={$t('admin.machine_learning_smart_search_enabled_description')}
          bind:checked={configToEdit.machineLearning.clip.enabled}
          disabled={disabled || !configToEdit.machineLearning.enabled}
        />

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
      </SystemSettingsCard>

      <SystemSettingsCard
        title={$t('admin.machine_learning_duplicate_detection')}
        subtitle={$t('admin.machine_learning_duplicate_detection_setting_description')}
      >
        <SettingSwitch
          title={$t('admin.machine_learning_duplicate_detection_enabled')}
          subtitle={$t('admin.machine_learning_duplicate_detection_enabled_description')}
          bind:checked={configToEdit.machineLearning.duplicateDetection.enabled}
          disabled={disabled || !configToEdit.machineLearning.enabled || !configToEdit.machineLearning.clip.enabled}
        />

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
      </SystemSettingsCard>

      <SystemSettingsCard
        title={$t('admin.machine_learning_facial_recognition')}
        subtitle={$t('admin.machine_learning_facial_recognition_description')}
      >
        <SettingSwitch
          title={$t('admin.machine_learning_facial_recognition_setting')}
          subtitle={$t('admin.machine_learning_facial_recognition_setting_description')}
          bind:checked={configToEdit.machineLearning.facialRecognition.enabled}
          disabled={disabled || !configToEdit.machineLearning.enabled}
        />

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
      </SystemSettingsCard>

      <SystemSettingsCard
        title={$t('admin.machine_learning_ocr')}
        subtitle={$t('admin.machine_learning_ocr_description')}
      >
        <SettingSwitch
          title={$t('admin.machine_learning_ocr_enabled')}
          subtitle={$t('admin.machine_learning_ocr_enabled_description')}
          bind:checked={configToEdit.machineLearning.ocr.enabled}
          disabled={disabled || !configToEdit.machineLearning.enabled}
        />

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
          isEdited={configToEdit.machineLearning.ocr.minDetectionScore !== config.machineLearning.ocr.minDetectionScore}
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
      </SystemSettingsCard>
    </div>
  {/snippet}
</SystemSettingsModal>
