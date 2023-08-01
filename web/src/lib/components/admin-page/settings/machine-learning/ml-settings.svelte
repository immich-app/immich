<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { api, SystemConfigMachineLearningDto } from '@api';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingAccordion from '../setting-accordion.svelte';
  import SettingSwitch from '../setting-switch.svelte';

  export let machineLearningConfig: SystemConfigMachineLearningDto; // this is the config that is being edited
  export let disabled = false;

  let savedConfig: SystemConfigMachineLearningDto;
  let defaultConfig: SystemConfigMachineLearningDto;

  async function getConfigs() {
    [savedConfig, defaultConfig] = await Promise.all([
      api.systemConfigApi.getConfig().then((res) => res.data.machineLearning),
      api.systemConfigApi.getDefaults().then((res) => res.data.machineLearning),
    ]);
  }

  async function saveSetting() {
    try {
      const { data: configs } = await api.systemConfigApi.getConfig();

      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: {
          ...configs,
          machineLearning: machineLearningConfig,
        },
      });

      machineLearningConfig = { ...result.data.machineLearning };
      savedConfig = { ...result.data.machineLearning };

      notificationController.show({
        message: 'ML settings saved',
        type: NotificationType.Info,
      });
    } catch (e) {
      console.error('Error [ml-settings] [saveSetting]', e);
      notificationController.show({
        message: 'Unable to save settings',
        type: NotificationType.Error,
      });
    }
  }

  async function reset() {
    const { data: resetConfig } = await api.systemConfigApi.getConfig();

    machineLearningConfig = { ...resetConfig.machineLearning };
    savedConfig = { ...resetConfig.machineLearning };

    notificationController.show({
      message: 'Reset ML settings to the recent saved settings',
      type: NotificationType.Info,
    });
  }

  async function resetToDefault() {
    const { data: configs } = await api.systemConfigApi.getDefaults();

    machineLearningConfig = { ...configs.machineLearning };
    defaultConfig = { ...configs.machineLearning };

    notificationController.show({
      message: 'Reset ML settings to default',
      type: NotificationType.Info,
    });
  }
</script>

<div>
  {#await getConfigs() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault>
        <div class="ml-4 mt-4 flex flex-col gap-4">
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
                bind:checked={machineLearningConfig.clipVision.enabled}
                disabled={disabled || !machineLearningConfig.enabled}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="CLIP VISION MODEL"
                bind:value={machineLearningConfig.clipVision.modelName}
                required={true}
                disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.clipVision.enabled}
                isEdited={machineLearningConfig.clipVision.modelName !== savedConfig.clipVision.modelName}
              />

              <SettingInputField
                inputType={SettingInputFieldType.TEXT}
                label="CLIP TEXT MODEL"
                bind:value={machineLearningConfig.clipText.modelName}
                required={true}
                disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.clipVision.enabled}
                isEdited={machineLearningConfig.clipText.modelName !== savedConfig.clipText.modelName}
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
                disabled={disabled ||
                  !machineLearningConfig.enabled ||
                  !machineLearningConfig.facialRecognition.enabled}
                isEdited={machineLearningConfig.facialRecognition.modelName !== savedConfig.facialRecognition.modelName}
              />

              <SettingInputField
                inputType={SettingInputFieldType.NUMBER}
                label="FACE DETECTION THRESHOLD"
                bind:value={machineLearningConfig.facialRecognition.minScore}
                disabled={disabled ||
                  !machineLearningConfig.enabled ||
                  !machineLearningConfig.facialRecognition.enabled}
                isEdited={machineLearningConfig.facialRecognition.minScore !== savedConfig.facialRecognition.minScore}
              />
            </div>
          </SettingAccordion>

          <div class="ml-4">
            <SettingButtonsRow
              on:reset={reset}
              on:save={saveSetting}
              on:reset-to-default={resetToDefault}
              showResetToDefault={!isEqual(savedConfig, defaultConfig)}
            />
          </div>
        </div>
      </form>
    </div>
  {/await}
</div>
