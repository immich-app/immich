<script lang="ts">
  import { goto } from '$app/navigation';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { oauth } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const handleUnlink = async () => {
    try {
      const response = await oauth.unlink();
      authManager.setUser(response);
      toastManager.primary($t('unlinked_oauth_account'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_unlink_account'));
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="sm:ms-8 flex justify-end">
      {#if featureFlagsManager.value.oauth}
        {#if authManager.user.oauthId}
          <Button shape="round" size="small" onclick={() => handleUnlink()}>{$t('unlink_oauth')}</Button>
        {:else}
          <Button shape="round" size="small" onclick={() => goto(Route.login({ autoLaunch: 1 }))}
            >{$t('link_to_oauth')}</Button
          >
        {/if}
      {/if}
    </div>
  </div>
</section>
