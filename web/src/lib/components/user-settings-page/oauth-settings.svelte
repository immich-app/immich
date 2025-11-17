<script lang="ts">
  import { goto } from '$app/navigation';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { oauth } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { type UserAdminResponseDto } from '@immich/sdk';
  import { Button, LoadingSpinner, toastManager } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    user: UserAdminResponseDto;
  }

  let { user = $bindable() }: Props = $props();

  let loading = $state(true);

  onMount(async () => {
    if (oauth.isCallback(globalThis.location)) {
      try {
        loading = true;
        user = await oauth.link(globalThis.location);
        toastManager.success($t('linked_oauth_account'));
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
      user = await oauth.unlink();
      toastManager.success($t('unlinked_oauth_account'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_unlink_account'));
    }
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    <div class="flex justify-end">
      {#if loading}
        <div class="flex place-content-center place-items-center">
          <LoadingSpinner />
        </div>
      {:else if featureFlagsManager.value.oauth}
        {#if user.oauthId}
          <Button shape="round" size="small" onclick={() => handleUnlink()}>{$t('unlink_oauth')}</Button>
        {:else}
          <Button shape="round" size="small" onclick={() => oauth.authorize(globalThis.location)}
            >{$t('link_to_oauth')}</Button
          >
        {/if}
      {/if}
    </div>
  </div>
</section>
