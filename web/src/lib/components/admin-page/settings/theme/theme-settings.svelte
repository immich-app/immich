<script lang="ts">
  import type { SystemConfigDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { SettingsEventType } from '../admin-settings';
  import SettingTextarea from '$lib/components/shared-components/settings/setting-textarea.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;

  const dispatch = createEventDispatcher<SettingsEventType>();
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingTextarea
          {disabled}
          label={$t('custom_css')}
          desc="Cascading Style Sheets allow the design of Immich to be customized."
          bind:value={config.theme.customCss}
          required={true}
          isEdited={config.theme.customCss !== savedConfig.theme.customCss}
        />

        <SettingButtonsRow
          on:reset={({ detail }) => dispatch('reset', { ...detail, configKeys: ['theme'] })}
          on:save={() => dispatch('save', { theme: config.theme })}
          showResetToDefault={!isEqual(savedConfig, defaultConfig)}
          {disabled}
        />
      </div>
    </form>
  </div>
</div>
