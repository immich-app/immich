<script lang="ts">
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import SettingButtonsRow from '../setting-buttons-row.svelte';
  import SettingInputField, { SettingInputFieldType } from '../setting-input-field.svelte';
  import SettingSwitch from '../setting-switch.svelte';
  import type { SystemConfigMachineLearningDto } from '@api';
  import { createEventDispatcher } from 'svelte';

  export let disabled = false;

  export let machineLearningConfig: SystemConfigMachineLearningDto; // this is the config that is being edited
  export let machineLearningDefault: SystemConfigMachineLearningDto;
  export let savedConfig: SystemConfigMachineLearningDto;

  const dispatch = createEventDispatcher<{
    save: SystemConfigMachineLearningDto;
  }>();

  async function reset() {
    machineLearningConfig = { ...savedConfig };
    notificationController.show({ message: 'Reset to the last saved settings', type: NotificationType.Info });
  }

  async function resetToDefault() {
    machineLearningConfig = { ...machineLearningDefault };

    notificationController.show({
      message: 'Reset storage template to default',
      type: NotificationType.Info,
    });
  }
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault class="mx-4 flex flex-col gap-4 py-4">
      <SettingSwitch
        title="Enabled"
        subtitle="Use machine learning features"
        {disabled}
        bind:checked={machineLearningConfig.enabled}
      />

      <hr />

      <SettingInputField
        inputType={SettingInputFieldType.TEXT}
        label="URL"
        desc="URL of machine learning server"
        bind:value={machineLearningConfig.url}
        required={true}
        disabled={disabled || !machineLearningConfig.enabled}
        isEdited={!(machineLearningConfig.url === machineLearningConfig.url)}
      />

      <SettingSwitch
        title="SMART SEARCH"
        subtitle="Extract CLIP embeddings for smart search"
        bind:checked={machineLearningConfig.clipEncodeEnabled}
        disabled={disabled || !machineLearningConfig.enabled}
      />

      <SettingSwitch
        title="FACIAL RECOGNITION"
        subtitle="Recognize and group faces in photos"
        disabled={disabled || !machineLearningConfig.enabled}
        bind:checked={machineLearningConfig.facialRecognitionEnabled}
      />

      <SettingSwitch
        title="IMAGE TAGGING"
        subtitle="Tag and classify images"
        disabled={disabled || !machineLearningConfig.enabled}
        bind:checked={machineLearningConfig.tagImageEnabled}
      />

      <SettingButtonsRow
        on:reset={reset}
        on:save={() => dispatch('save', machineLearningConfig)}
        on:reset-to-default={resetToDefault}
        showResetToDefault={!isEqual(machineLearningConfig, machineLearningDefault)}
        {disabled}
      />
    </form>
  </div>
</div>
