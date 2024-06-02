<script lang="ts">
  import { goto } from '$app/navigation';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { oauth } from '$lib/utils';
  import { type UserAdminResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import Button from '../elements/buttons/button.svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import { t } from 'svelte-i18n';

  export let user: UserAdminResponseDto;

  let loading = true;

  onMount(async () => {
    if (oauth.isCallback(window.location)) {
      try {
        loading = true;

        user = await oauth.link(window.location);

        notificationController.show({
          message: $t('linked_oauth_account'),
          type: NotificationType.Info,
        });
      } catch (error) {
        handleError(error, 'Unable to link OAuth account');
      } finally {
        await goto('?open=oauth');
      }
    }

    loading = false;
  });

  const handleUnlink = async () => {
    try {
      user = await oauth.unlink();
      notificationController.show({
        message: $t('unlinked_oauth_account'),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('unable_to_unlink_account'));
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
      {:else if $featureFlags.oauth}
        {#if user.oauthId}
          <Button size="sm" on:click={() => handleUnlink()}>{$t('unlink_oauth')}</Button>
        {:else}
          <Button size="sm" on:click={() => oauth.authorize(window.location)}>{$t('link_to_oauth')}</Button>
        {/if}
      {/if}
    </div>
  </div>
</section>
