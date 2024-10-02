<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { t } from 'svelte-i18n';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mx-4 mt-4">
      <div class="flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.machine_learning_enabled')}
          subtitle={$t('admin.machine_learning_enabled_description')}
          {disabled}
          bind:checked={config.machineLearning.enabled}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label={$t('url')}
          desc={$t('admin.machine_learning_url_description')}
          bind:value={config.machineLearning.url}
          required={true}
          disabled={disabled || !config.machineLearning.enabled}
          isEdited={config.machineLearning.url !== savedConfig.machineLearning.url}
        />
      </div>

      <SettingAccordion
        key="smart-search"
        title={$t('admin.machine_learning_smart_search')}
        subtitle={$t('admin.machine_learning_smart_search_description')}
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_smart_search_enabled')}
            subtitle={$t('admin.machine_learning_smart_search_enabled_description')}
            bind:checked={config.machineLearning.clip.enabled}
            disabled={disabled || !config.machineLearning.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label={$t('admin.machine_learning_clip_model')}
            bind:value={config.machineLearning.clip.modelName}
            required={true}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.clip.enabled}
            isEdited={config.machineLearning.clip.modelName !== savedConfig.machineLearning.clip.modelName}
          >
            <p slot="desc" class="immich-form-label pb-2 text-sm">
              <FormatMessage key="admin.machine_learning_clip_model_description" let:message>
                <a href="https://huggingface.co/immich-app"><u>{message}</u></a>
              </FormatMessage>
            </p>
          </SettingInputField>
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="duplicate-detection"
        title={$t('admin.machine_learning_duplicate_detection')}
        subtitle={$t('admin.machine_learning_duplicate_detection_setting_description')}
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_duplicate_detection_enabled')}
            subtitle={$t('admin.machine_learning_duplicate_detection_enabled_description')}
            bind:checked={config.machineLearning.duplicateDetection.enabled}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.clip.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_max_detection_distance')}
            bind:value={config.machineLearning.duplicateDetection.maxDistance}
            step="0.0005"
            min={0.001}
            max={0.1}
            desc={$t('admin.machine_learning_max_detection_distance_description')}
            disabled={disabled || !$featureFlags.duplicateDetection}
            isEdited={config.machineLearning.duplicateDetection.maxDistance !==
              savedConfig.machineLearning.duplicateDetection.maxDistance}
          />
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="facial-recognition"
        title={$t('admin.machine_learning_facial_recognition')}
        subtitle={$t('admin.machine_learning_facial_recognition_description')}
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title={$t('admin.machine_learning_facial_recognition_setting')}
            subtitle={$t('admin.machine_learning_facial_recognition_setting_description')}
            bind:checked={config.machineLearning.facialRecognition.enabled}
            disabled={disabled || !config.machineLearning.enabled}
          />

          <hr />

          <SettingSelect
            label={$t('admin.machine_learning_facial_recognition_model')}
            desc={$t('admin.machine_learning_facial_recognition_model_description')}
            name="facial-recognition-model"
            bind:value={config.machineLearning.facialRecognition.modelName}
            options={[
              { value: 'antelopev2', text: 'antelopev2' },
              { value: 'buffalo_l', text: 'buffalo_l' },
              { value: 'buffalo_m', text: 'buffalo_m' },
              { value: 'buffalo_s', text: 'buffalo_s' },
            ]}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.facialRecognition.enabled}
            isEdited={config.machineLearning.facialRecognition.modelName !==
              savedConfig.machineLearning.facialRecognition.modelName}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_min_detection_score')}
            desc={$t('admin.machine_learning_min_detection_score_description')}
            bind:value={config.machineLearning.facialRecognition.minScore}
            step="0.1"
            min={0.1}
            max={1}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.facialRecognition.enabled}
            isEdited={config.machineLearning.facialRecognition.minScore !==
              savedConfig.machineLearning.facialRecognition.minScore}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_max_recognition_distance')}
            desc={$t('admin.machine_learning_max_recognition_distance_description')}
            bind:value={config.machineLearning.facialRecognition.maxDistance}
            step="0.1"
            min={0.1}
            max={2}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.facialRecognition.enabled}
            isEdited={config.machineLearning.facialRecognition.maxDistance !==
              savedConfig.machineLearning.facialRecognition.maxDistance}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label={$t('admin.machine_learning_min_recognized_faces')}
            desc={$t('admin.machine_learning_min_recognized_faces_description')}
            bind:value={config.machineLearning.facialRecognition.minFaces}
            step="1"
            min={1}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.facialRecognition.enabled}
            isEdited={config.machineLearning.facialRecognition.minFaces !==
              savedConfig.machineLearning.facialRecognition.minFaces}
          />
        </div>
      </SettingAccordion>

      <SettingButtonsRow
        onReset={(options) => onReset({ ...options, configKeys: ['machineLearning'] })}
        onSave={() => onSave({ machineLearning: config.machineLearning })}
        showResetToDefault={!isEqual(savedConfig.machineLearning, defaultConfig.machineLearning)}
        {disabled}
      />
    </form>
  </div>
</div>
