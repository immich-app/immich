<script lang="ts">
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
  import { unlinkOAuthAccountMutation } from '#lib/queries/oauth.query.ts';
  import { Route } from '#lib/route.ts';
  import { Button, Stack, Text } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';

  const query = createPreloadedQuery(getUserConfigQuery);
  const config = $derived(query.data);

  const unlink = createMutation(unlinkOAuthAccountMutation);
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
              <Button shape="round" size="small" color="danger" onclick={() => unlink.mutate([])}>
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
