<script lang="ts">
  import { goto } from '$app/navigation';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { oauth } from '$lib/utils';
  import { type UserAdminResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import { t } from 'svelte-i18n';
  import { Button } from '@immich/ui';

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

        notificationController.show({
          message: $t('linked_oauth_account'),
          type: NotificationType.Info,
        });
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
      notificationController.show({
        message: $t('unlinked_oauth_account'),
        type: NotificationType.Info,
      });
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
      {:else if $featureFlags.oauth}
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
