<script lang="ts">
  import { OpenQueryParam } from '#lib/constants.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { createPreloadedQuery, executeMutation } from '#lib/queries/client.ts';
  import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
  import { linkOAuthAccountMutation, unlinkOAuthAccountMutation } from '#lib/queries/oauth.query.ts';
  import { Route } from '#lib/route.ts';
  import { oauth } from '#lib/utils.ts';
  import { Button, LoadingSpinner } from '@immich/ui';
  import { createMutation } from '@tanstack/svelte-query';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { goto } from '$app/navigation';

  const query = createPreloadedQuery(getUserConfigQuery);
  const config = $derived(query.data);

  let loading = $state(true);

  onMount(async () => {
    if (oauth.isCallback(location)) {
      await executeMutation(linkOAuthAccountMutation, [{ oAuthCallbackDto: { url: location.href } }]);
      await goto(Route.userSettings({ isOpen: OpenQueryParam.OAUTH }));
    }

    loading = false;
  });

  const unlink = createMutation(unlinkOAuthAccountMutation);
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="flex justify-end gap-3 sm:ms-8">
      {#if loading}
        <div class="flex place-content-center place-items-center">
          <LoadingSpinner />
        </div>
      {:else if config.oauth.enabled}
        {#if authManager.user.oauthId}
          {#if config.oauth.accountManagementUrl}
            <Button shape="round" size="small" href={config.oauth.accountManagementUrl}
              >{$t('manage_oauth_account')}</Button
            >
          {/if}
          <Button shape="round" size="small" onclick={() => unlink.mutate([])}>{$t('unlink_oauth')}</Button>
        {:else}
          <Button shape="round" size="small" onclick={() => oauth.authorize(location)}>{$t('link_to_oauth')}</Button>
        {/if}
      {/if}
    </div>
  </div>
</section>
