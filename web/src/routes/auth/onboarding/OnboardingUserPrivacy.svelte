<script lang="ts">
  import SettingSwitch from '#lib/components/shared-components/settings/SettingSwitch.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { updateMyPreferencesMutation } from '#lib/queries/user.query.ts';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  let gCastEnabled = $state(authManager.authenticated && authManager.preferences.cast.gCastEnabled);

  onDestroy(() =>
    executeMutation(
      () => updateMyPreferencesMutation({ error: { toast: 'errors.unable_to_update_settings' } }),
      [{ userPreferencesUpdateDto: { cast: { gCastEnabled } } }],
    ),
  );
</script>

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_privacy_description')}
  </p>

  <SettingSwitch title={$t('gcast_enabled')} subtitle={$t('gcast_enabled_description')} bind:checked={gCastEnabled} />
</div>
