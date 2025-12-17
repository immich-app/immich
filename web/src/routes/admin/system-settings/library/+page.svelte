<script lang="ts">
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { Field, NumberInput } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['user']}>
  {#snippet child({ disabled, configToEdit })}
    <Field
      label={$t('admin.user_delete_delay_settings')}
      description={$t('admin.user_delete_delay_settings_description')}
      {disabled}
    >
      <NumberInput bind:value={configToEdit.user.deleteDelay} min={1} />
    </Field>
  {/snippet}
</SystemSettingsModal>
