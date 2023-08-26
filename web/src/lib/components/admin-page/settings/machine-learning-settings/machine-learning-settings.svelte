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
  import SettingSelect from '../setting-select.svelte';

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
              desc="Note that you must re-run the 'Tag Objects' job for all images upon changing a model."
              bind:value={machineLearningConfig.classification.modelName}
              required={true}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.classification.enabled}
              isEdited={machineLearningConfig.classification.modelName !== savedConfig.classification.modelName}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="IMAGE CLASSIFICATION THRESHOLD"
              bind:value={machineLearningConfig.classification.minScore}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.classification.enabled}
              isEdited={machineLearningConfig.classification.minScore !== savedConfig.classification.minScore}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion title="Smart Search" subtitle="Search for images semantically using CLIP embeddings">
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
              desc="Note that you must re-run the 'Encode CLIP' job for all images upon changing a model."
              bind:value={machineLearningConfig.clip.modelName}
              required={true}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.clip.enabled}
              isEdited={machineLearningConfig.clip.modelName !== savedConfig.clip.modelName}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion title="Facial Recognition" subtitle="Detect, recognize and group faces in images">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="Enabled"
              subtitle="If disabled, images will not be encoded for facial recognition"
              bind:checked={machineLearningConfig.facialRecognition.enabled}
              disabled={disabled || !machineLearningConfig.enabled}
            />

            <SettingSelect
              label="FACIAL RECOGNITION MODEL"
              desc="Smaller models are faster, but perform worse. Note that you must re-run the 'Recognize Faces' job for all images upon changing a model."
              name="facial-recognition-model"
              bind:value={machineLearningConfig.facialRecognition.modelName}
              options={[
                { value: 'buffalo_l', text: 'buffalo_l' },
                { value: 'buffalo_s', text: 'buffalo_s' },
                { value: 'buffalo_sc', text: 'buffalo_sc' },
              ]}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.modelName !== savedConfig.facialRecognition.modelName}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="MIN DETECTION SCORE"
              desc="Minimum confidence score for a face to be detected from 0-1. Lower values will detect more faces but may result in false positives."
              bind:value={machineLearningConfig.facialRecognition.minScore}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.minScore !== savedConfig.facialRecognition.minScore}
            />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="MAX RECOGNITION DISTANCE"
              desc="Maximum distance between two faces to be considered the same person, ranging from 0-2. Lowering this can prevent it from labeling two people as the same person. Raising this can prevent it from labeling the same person as two different people. Note that it is easier to merge two people than to split one person in two, so err on the side of a lower threshold when possible."
              bind:value={machineLearningConfig.facialRecognition.maxDistance}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.maxDistance !==
                savedConfig.facialRecognition.maxDistance}
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
