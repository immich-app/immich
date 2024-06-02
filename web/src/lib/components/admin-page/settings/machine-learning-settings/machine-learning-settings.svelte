<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingAccordion from '$lib/components/shared-components/settings/setting-accordion.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mx-4 mt-4">
      <div class="flex flex-col gap-4">
        <SettingSwitch
          title="ENABLED"
          subtitle="If disabled, all ML features will be disabled regardless of the below settings."
          {disabled}
          bind:checked={config.machineLearning.enabled}
        />

        <hr />

        <SettingInputField
          inputType={SettingInputFieldType.TEXT}
          label="URL"
          desc="URL of the machine learning server"
          bind:value={config.machineLearning.url}
          required={true}
          disabled={disabled || !config.machineLearning.enabled}
          isEdited={config.machineLearning.url !== savedConfig.machineLearning.url}
        />
      </div>

      <SettingAccordion
        key="smart-search"
        title="Smart Search"
        subtitle="Search for images semantically using CLIP embeddings"
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title="ENABLED"
            subtitle="If disabled, images will not be encoded for smart search."
            bind:checked={config.machineLearning.clip.enabled}
            disabled={disabled || !config.machineLearning.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label="CLIP MODEL"
            bind:value={config.machineLearning.clip.modelName}
            required={true}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.clip.enabled}
            isEdited={config.machineLearning.clip.modelName !== savedConfig.machineLearning.clip.modelName}
          >
            <p slot="desc" class="immich-form-label pb-2 text-sm">
              The name of a CLIP model listed <a href="https://huggingface.co/immich-app"><u>here</u></a>. Note that you
              must re-run the 'Smart Search' job for all images upon changing a model.
            </p>
          </SettingInputField>
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="duplicate-detection"
        title="Duplicate Detection"
        subtitle="Use CLIP embeddings to find likely duplicates"
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title="ENABLED"
            subtitle="If disabled, exactly identical assets will still be de-duplicated."
            bind:checked={config.machineLearning.duplicateDetection.enabled}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.clip.enabled}
          />

          <hr />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label="MAX DETECTION DISTANCE"
            bind:value={config.machineLearning.duplicateDetection.maxDistance}
            step="0.0005"
            min={0.001}
            max={0.1}
            desc="Maximum distance between two images to consider them duplicates, ranging from 0.001-0.1. Higher values will detect more duplicates, but may result in false positives."
            disabled={disabled || !$featureFlags.duplicateDetection}
            isEdited={config.machineLearning.duplicateDetection.maxDistance !==
              savedConfig.machineLearning.duplicateDetection.maxDistance}
          />
        </div>
      </SettingAccordion>

      <SettingAccordion
        key="facial-recognition"
        title="Facial Recognition"
        subtitle="Detect, recognize and group faces in images"
      >
        <div class="ml-4 mt-4 flex flex-col gap-4">
          <SettingSwitch
            title="ENABLED"
            subtitle="If disabled, images will not be encoded for facial recognition and will not populate the People section in the Explore page."
            bind:checked={config.machineLearning.facialRecognition.enabled}
            disabled={disabled || !config.machineLearning.enabled}
          />

          <hr />

          <SettingSelect
            label="FACIAL RECOGNITION MODEL"
            desc="Models are listed in descending order of size. Larger models are slower and use more memory, but produce better results. Note that you must re-run the Face Detection job for all images upon changing a model."
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
            label="MIN DETECTION SCORE"
            desc="Minimum confidence score for a face to be detected from 0-1. Lower values will detect more faces but may result in false positives."
            bind:value={config.machineLearning.facialRecognition.minScore}
            step="0.1"
            min={0}
            max={1}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.facialRecognition.enabled}
            isEdited={config.machineLearning.facialRecognition.minScore !==
              savedConfig.machineLearning.facialRecognition.minScore}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label="MAX RECOGNITION DISTANCE"
            desc="Maximum distance between two faces to be considered the same person, ranging from 0-2. Lowering this can prevent labeling two people as the same person, while raising it can prevent labeling the same person as two different people. Note that it is easier to merge two people than to split one person in two, so err on the side of a lower threshold when possible."
            bind:value={config.machineLearning.facialRecognition.maxDistance}
            step="0.1"
            min={0}
            max={2}
            disabled={disabled || !config.machineLearning.enabled || !config.machineLearning.facialRecognition.enabled}
            isEdited={config.machineLearning.facialRecognition.maxDistance !==
              savedConfig.machineLearning.facialRecognition.maxDistance}
          />

          <SettingInputField
            inputType={SettingInputFieldType.NUMBER}
            label="MIN RECOGNIZED FACES"
            desc="The minimum number of recognized faces for a person to be created. Increasing this makes Facial Recognition more precise at the cost of increasing the chance that a face is not assigned to a person."
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
        on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['machineLearning'] })}
        on:save={() => dispatch('save', { machineLearning: config.machineLearning })}
        showResetToDefault={!isEqual(savedConfig.machineLearning, defaultConfig.machineLearning)}
        {disabled}
      />
    </form>
  </div>
</div>
