<script lang="ts">
  import { goto } from '$app/navigation';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { oauth } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, Stack, Text, toastManager } from '@immich/ui';
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

{#if featureFlagsManager.value.oauth}
  <section class="my-4">
    <div in:fade={{ duration: 500 }}>
      <Stack gap={3}>
        {#if authManager.user.oauthId}
          <Text>{$t('oauth_account_is_linked')}</Text>
          {#if featureFlagsManager.value.passwordLogin}
            <div class="sm:ms-8 flex justify-end">
              <Button shape="round" size="small" color="danger" onclick={() => handleUnlink()}>
                {$t('unlink_oauth')}
              </Button>
            </div>
          {/if}
        {:else}
          <Text>{$t('oauth_account_not_linked')}</Text>
          <div class="sm:ms-8 flex justify-end">
            <Button shape="round" size="small" onclick={() => goto(Route.login({ autoLaunch: 1 }))}>
              {$t('link_to_oauth')}
            </Button>
          </div>
        {/if}
      </Stack>
    </div>
  </section>
{/if}
