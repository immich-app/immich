<script lang="ts">
  import SystemSettingsModal from '$lib/modals/SystemSettingsModal.svelte';
  import { onBeforeSave } from '$lib/services/system-config.service';
  import { Field, Switch } from '@immich/ui';
  import { t } from 'svelte-i18n';
</script>

<SystemSettingsModal keys={['passwordLogin']} size="small" {onBeforeSave}>
  {#snippet child({ disabled, configToEdit })}
    <Field label={$t('admin.password_enable_description')} {disabled}>
      <Switch bind:checked={configToEdit.passwordLogin.enabled} />
    </Field>
  {/snippet}
</SystemSettingsModal>
