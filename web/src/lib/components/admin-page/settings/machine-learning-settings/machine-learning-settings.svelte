<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api, SystemConfigMachineLearningDto } from '@api';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import SettingAccordion from '../setting-accordion.svelte';

  export let machineLearningConfig: SystemConfigMachineLearningDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigMachineLearningDto;
  let defaultConfig: SystemConfigMachineLearningDto;

  async function refreshConfig() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.machineLearning),
      api.systemConfigApi.getDefaults().then((res) => res.data.machineLearning),
    ]);
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();
    machineLearningConfig = { ...resetConfig.machineLearning };
    savedConfig = { ...resetConfig.machineLearning };
    notificationController.show({ message: 'Reset to the last saved settings', type: NotificationType.Info });
  }

  async function saveSetting() {
    try {
      const { data: current } = await api.systemConfigApi.getConfig();
      await api.systemConfigApi.updateConfig({
        systemConfigDto: { ...current, machineLearning: machineLearningConfig },
      });
      await refreshConfig();
      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function resetToDefault() {
    await refreshConfig();
    const { data: defaults } = await api.systemConfigApi.getDefaults();
    machineLearningConfig = { ...defaults.machineLearning };
    defaultConfig = { ...defaults.machineLearning };

    notificationController.show({ message: 'Reset settings to defaults', type: NotificationType.Info });
  }
</script>

<div class="mt-2">
  {#await refreshConfig() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault class="mx-4 flex flex-col gap-4 py-4">
        <SettingSwitch
          title="Enabled"
          subtitle="If disabled, all ML features will be disabled regardless of the below settings"
          {disabled}
          bind:checked={machineLearningConfig.enabled}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="URL"
          desc="URL of the machine learning server"
          bind:value={machineLearningConfig.url}
          required={true}
          disabled={disabled || !machineLearningConfig.enabled}
          isEdited={machineLearningConfig.url !== machineLearningConfig.url}
        />

        <SettingAccordion title="Image Tagging" subtitle="Tag and classify images with object labels">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="Enabled"
              subtitle="If disabled, images will not be tagged"
              bind:checked={machineLearningConfig.classification.enabled}
              disabled={disabled || !machineLearningConfig.enabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="IMAGE CLASSIFICATION MODEL"
              bind:value={machineLearningConfig.classification.modelName}
              required={true}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.classification.enabled}
              isEdited={machineLearningConfig.classification.modelName !== savedConfig.classification.modelName}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="IMAGE CLASSIFICATION THRESHOLD"
              bind:value={machineLearningConfig.classification.minScore}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.classification.enabled}
              isEdited={machineLearningConfig.classification.minScore !== savedConfig.classification.minScore}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion title="SMART SEARCH" subtitle="Search for images semantically using CLIP embeddings">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="Enabled"
              subtitle="If disabled, images will not be encoded for smart search"
              bind:checked={machineLearningConfig.clip.enabled}
              disabled={disabled || !machineLearningConfig.enabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="CLIP MODEL"
              bind:value={machineLearningConfig.clip.modelName}
              required={true}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.clip.enabled}
              isEdited={machineLearningConfig.clip.modelName !== savedConfig.clip.modelName}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion title="FACIAL RECOGNITION" subtitle="Recognize and group faces in images">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="Enabled"
              subtitle="If disabled, images will not be encoded for facial recognition"
              bind:checked={machineLearningConfig.facialRecognition.enabled}
              disabled={disabled || !machineLearningConfig.enabled}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="FACIAL RECOGNITION MODEL"
              bind:value={machineLearningConfig.facialRecognition.modelName}
              required={true}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.modelName !== savedConfig.facialRecognition.modelName}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="FACE DETECTION THRESHOLD"
              bind:value={machineLearningConfig.facialRecognition.minScore}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.minScore !== savedConfig.facialRecognition.minScore}
            />
          </div>
        </SettingAccordion>

        <SettingButtonsRow
          on:reset={reset}
          on:save={saveSetting}
          on:reset-to-default={resetToDefault}
          showResetToDefault={!isEqual(savedConfig, defaultConfig)}
          {disabled}
        />
      </form>
    </div>
  {/await}
</div>
