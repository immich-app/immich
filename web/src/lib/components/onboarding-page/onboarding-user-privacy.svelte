<script lang="ts">
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { updateMyPreferences } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  let gCastEnabled = $state($preferences?.cast?.gCastEnabled ?? false);

  onDestroy(async () => {
    try {
      const data = await updateMyPreferences({
        userPreferencesUpdateDto: {
          cast: { gCastEnabled },
        },
      });

      $preferences = { ...data };
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_settings'));
    }
  });
</script>

<div class="flex flex-col gap-4">
  <p>
    {$t('onboarding_privacy_description')}
  </p>

  <SettingSwitch title={$t('gcast_enabled')} subtitle={$t('gcast_enabled_description')} bind:checked={gCastEnabled} />
</div>
