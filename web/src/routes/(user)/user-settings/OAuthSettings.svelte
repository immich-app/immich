<script lang="ts">
  import { goto } from '$app/navigation';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { oauth } from '#lib/utils.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { Button, LoadingSpinner, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { createPreloadedQuery } from '#lib/queries/client.ts';
  import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';

  const query = createPreloadedQuery(getUserConfigQuery);
  const config = $derived(query.data);

  let loading = $state(true);

  onMount(async () => {
    if (oauth.isCallback(location)) {
      try {
        loading = true;
        const response = await oauth.link(location);
        authManager.setUser(response);
        toastManager.primary($t('linked_oauth_account'));
      } catch (error) {
        handleError(error, $t('errors.unable_to_link_oauth_account'));
      } finally {
        await goto('?open=oauth');
      }
    }

    loading = false;
  });

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
          <Button shape="round" size="small" onclick={() => handleUnlink()}>{$t('unlink_oauth')}</Button>
        {:else}
          <Button shape="round" size="small" onclick={() => oauth.authorize(location)}>{$t('link_to_oauth')}</Button>
        {/if}
      {/if}
    </div>
  </div>
</section>
