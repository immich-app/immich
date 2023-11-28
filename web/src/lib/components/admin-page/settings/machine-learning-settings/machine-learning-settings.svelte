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
      api.systemConfigApi.getConfigDefaults().then((res) => res.data.machineLearning),
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
      const result = await api.systemConfigApi.updateConfig({
        systemConfigDto: { ...current, machineLearning: machineLearningConfig },
      });

      machineLearningConfig = { ...result.data.machineLearning };
      savedConfig = { ...result.data.machineLearning };

      notificationController.show({ message: 'Settings saved', type: NotificationType.Info });
    } catch (error) {
      handleError(error, 'Unable to save settings');
    }
  }

  async function resetToDefault() {
    machineLearningConfig = { ...defaultConfig };
    notificationController.show({ message: 'Reset settings to defaults', type: NotificationType.Info });
  }
</script>

<div class="mt-2">
  {#await refreshConfig() then}
    <div in:fade={{ duration: 500 }}>
      <form autocomplete="off" on:submit|preventDefault class="mx-4 mt-4">
        <div class="flex flex-col gap-4">
          <SettingSwitch
            title="ENABLED"
            subtitle="If disabled, all ML features will be disabled regardless of the below settings."
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
            isEdited={machineLearningConfig.url !== savedConfig.url}
          />
        </div>

        <SettingAccordion title="Image Tagging" subtitle="Tag and classify images with object labels">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="ENABLED"
              subtitle="If disabled, images will not be tagged. This affects the Things section in the Explore page as well as 'm:' searches."
              bind:checked={machineLearningConfig.classification.enabled}
              disabled={disabled || !machineLearningConfig.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="IMAGE CLASSIFICATION MODEL"
              bind:value={machineLearningConfig.classification.modelName}
              required={true}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.classification.enabled}
              isEdited={machineLearningConfig.classification.modelName !== savedConfig.classification.modelName}
            >
              <p slot="desc" class="immich-form-label pb-2 text-sm">
                The name of an image classification model listed <a
                  href="https://huggingface.co/models?pipeline_tag=image-classification&sort=trending"><u>here</u></a
                >. It must be tagged with the 'Image Classification' task and must support ONNX conversion.
              </p>
            </SettingInputField>

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="IMAGE CLASSIFICATION THRESHOLD"
              desc="Minimum confidence score to add a particular object tag. Lower values will add more tags to images, but may result in more false positives. Will not have any effect until the Tag Objects job is re-run."
              bind:value={machineLearningConfig.classification.minScore}
              step="0.1"
              min="0"
              max="1"
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.classification.enabled}
              isEdited={machineLearningConfig.classification.minScore !== savedConfig.classification.minScore}
            />
          </div>
        </SettingAccordion>

        <SettingAccordion title="Smart Search" subtitle="Search for images semantically using CLIP embeddings">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="ENABLED"
              subtitle="If disabled, images will not be encoded for smart search."
              bind:checked={machineLearningConfig.clip.enabled}
              disabled={disabled || !machineLearningConfig.enabled}
            />

            <hr />

            <SettingInputField
              inputType={SettingInputFieldType.TEXT}
              label="CLIP MODEL"
              bind:value={machineLearningConfig.clip.modelName}
              required={true}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.clip.enabled}
              isEdited={machineLearningConfig.clip.modelName !== savedConfig.clip.modelName}
            >
              <p slot="desc" class="immich-form-label pb-2 text-sm">
                The name of a CLIP model listed <a href="https://huggingface.co/immich-app"><u>here</u></a>. Note that
                you must re-run the 'Encode CLIP' job for all images upon changing a model.
              </p>
            </SettingInputField>
          </div>
        </SettingAccordion>

        <SettingAccordion title="Facial Recognition" subtitle="Detect, recognize and group faces in images">
          <div class="ml-4 mt-4 flex flex-col gap-4">
            <SettingSwitch
              title="ENABLED"
              subtitle="If disabled, images will not be encoded for facial recognition and will not populate the People section in the Explore page."
              bind:checked={machineLearningConfig.facialRecognition.enabled}
              disabled={disabled || !machineLearningConfig.enabled}
            />

            <hr />

            <SettingSelect
              label="FACIAL RECOGNITION MODEL"
              desc="Models are listed in descending order of size. Larger models are slower and use more memory, but produce better results. Note that you must re-run the Recognize Faces job for all images upon changing a model."
              name="facial-recognition-model"
              bind:value={machineLearningConfig.facialRecognition.modelName}
              options={[
                { value: 'antelopev2', text: 'antelopev2' },
                { value: 'buffalo_l', text: 'buffalo_l' },
                { value: 'buffalo_m', text: 'buffalo_m' },
                { value: 'buffalo_s', text: 'buffalo_s' },
              ]}
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.modelName !== savedConfig.facialRecognition.modelName}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="MIN DETECTION SCORE"
              desc="Minimum confidence score for a face to be detected from 0-1. Lower values will detect more faces but may result in false positives."
              bind:value={machineLearningConfig.facialRecognition.minScore}
              step="0.1"
              min="0"
              max="1"
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.minScore !== savedConfig.facialRecognition.minScore}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="MAX RECOGNITION DISTANCE"
              desc="Maximum distance between two faces to be considered the same person, ranging from 0-2. Lowering this can prevent labeling two people as the same person, while raising it can prevent labeling the same person as two different people. Note that it is easier to merge two people than to split one person in two, so err on the side of a lower threshold when possible."
              bind:value={machineLearningConfig.facialRecognition.maxDistance}
              step="0.1"
              min="0"
              max="2"
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.maxDistance !==
                savedConfig.facialRecognition.maxDistance}
            />

            <SettingInputField
              inputType={SettingInputFieldType.NUMBER}
              label="MIN FACES DETECTED"
              desc="The minimum number of faces of a person that must be detected for them to appear in the People tab. Setting this to a value greater than 1 can prevent strangers or blurry faces that are not the main subject of the image from being displayed."
              bind:value={machineLearningConfig.facialRecognition.minFaces}
              step="1"
              min="1"
              disabled={disabled || !machineLearningConfig.enabled || !machineLearningConfig.facialRecognition.enabled}
              isEdited={machineLearningConfig.facialRecognition.minFaces !== savedConfig.facialRecognition.minFaces}
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
