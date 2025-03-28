<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import FormatMessage from '$lib/components/i18n/format-message.svelte';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlags } from '$lib/stores/server-config.store';
  import type { SystemConfigDto } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiMinusCircle } from '@mdi/js';
  import { isEqual } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';

  interface Props {
    savedConfig: SystemConfigDto;
    defaultConfig: SystemConfigDto;
    config: SystemConfigDto;
    disabled?: boolean;
    onReset: SettingsResetEvent;
    onSave: SettingsSaveEvent;
  }

  let { savedConfig, defaultConfig, config = $bindable(), disabled = false, onReset, onSave }: Props = $props();

  const onsubmit = (event: Event) => {
    event.preventDefault();
  };
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" {onsubmit} class="mx-4 mt-4">
      <div class="flex flex-col gap-4">
        <SettingSwitch
          title={$t('admin.machine_learning_enabled')}
          subtitle={$t('admin.machine_learning_enabled_description')}
          {disabled}
          bind:checked={config.machineLearning.enabled}
        />

        <hr />

        <div>
          {#each config.machineLearning.urls as _, i (i)}
            {#snippet removeButton()}
              {#if config.machineLearning.urls.length > 1}
                <CircleIconButton
                  size="24"
                  class="ml-2"
                  padding="2"
                  color="red"
                  title=""
                  onclick={() => config.machineLearning.urls.splice(i, 1)}
                  icon={mdiMinusCircle}
                />
              {/if}
            {/snippet}

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label={i === 0 ? $t('url') : undefined}
              description={i === 0 ? $t('admin.machine_learning_url_description') : undefined}
              bind:value={config.machineLearning.urls[i]}
              required={i === 0}
              disabled={disabled || !config.machineLearning.enabled}
              isEdited={i === 0 && !isEqual(config.machineLearning.urls, savedConfig.machineLearning.urls)}
              trailingSnippet={removeButton}
            />
          {/each}
        </div>

        <Button
          class="mb-2"
          size="small"
          shape="round"
          onclick={() => config.machineLearning.urls.splice(0, 0, '')}
          disabled={disabled || !config.machineLearning.enabled}>{$t('add_url')}</Button
        >
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
            description={$t('admin.machine_learning_max_detection_distance_description')}
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
            description={$t('admin.machine_learning_min_detection_score_description')}
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
            description={$t('admin.machine_learning_max_recognition_distance_description')}
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
            description={$t('admin.machine_learning_min_recognized_faces_description')}
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
