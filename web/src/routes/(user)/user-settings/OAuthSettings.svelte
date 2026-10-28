<script lang="ts">
  import { goto } from '$app/navigation';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
  import { Route } from '#lib/route.ts';
  import { oauth } from '#lib/utils.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { Button, Stack, Text, toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';

  const query = createPreloadedQuery(getUserConfigQuery);
  const config = $derived(query.data);

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

{#if config.oauth.enabled}
  <section class="my-4">
    <div in:fade={{ duration: 500 }}>
      <Stack gap={3}>
        {#if authManager.user.oauthId}
          <Text>{$t('oauth_account_is_linked')}</Text>
          <div class="flex justify-end gap-3 sm:ms-8">
            {#if config.oauth.accountManagementUrl}
              <Button shape="round" size="small" href={config.oauth.accountManagementUrl}>
                {$t('manage_oauth_account')}
              </Button>
            {/if}
            {#if featureFlagsManager.value.passwordLogin}
              <Button shape="round" size="small" color="danger" onclick={() => handleUnlink()}>
                {$t('unlink_oauth')}
              </Button>
            {/if}
          </div>
        {:else}
          <Text>{$t('oauth_account_not_linked')}</Text>
          <div class="flex justify-end sm:ms-8">
            <Button shape="round" size="small" onclick={() => goto(Route.login({ autoLaunch: 1 }))}>
              {$t('link_to_oauth')}
            </Button>
          </div>
        {/if}
      </Stack>
    </div>
  </section>
{/if}
