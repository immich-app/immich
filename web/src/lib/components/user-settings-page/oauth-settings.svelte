<script lang="ts">
  import { goto } from '$app/navigation';
  import { oauth, OAuthConfigResponseDto, UserResponseDto } from '@api';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { handleError } from '../../utils/handle-error';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import Button from '../elements/buttons/button.svelte';

  export let user: UserResponseDto;

  let config: OAuthConfigResponseDto = { enabled: false, passwordLoginEnabled: true };
  let loading = true;

  onMount(async () => {
    if (oauth.isCallback(window.location)) {
      try {
        loading = true;

        const { data } = await oauth.link(window.location);
        user = data;

        notificationController.show({
          message: 'Linked OAuth account',
          type: NotificationType.Info,
        });
      } catch (error) {
        handleError(error, 'Unable to link OAuth account');
      } finally {
        goto('?open=oauth');
      }
    }

    try {
      const { data } = await oauth.getConfig(window.location);
      config = data;
    } catch (error) {
      handleError(error, 'Unable to load OAuth config');
    }

    loading = false;
  });

  const handleUnlink = async () => {
    try {
      const { data } = await oauth.unlink();
      user = data;
      notificationController.show({
        message: 'Unlinked OAuth account',
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to unlink account');
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
      {:else if config.enabled}
        {#if user.oauthId}
          <Button size="sm" on:click={() => handleUnlink()}>Unlink Oauth</Button>
        {:else}
          <a href={config.url}>
            <Button size="sm" on:click={() => handleUnlink()}>Link to OAuth</Button>
          </a>
        {/if}
      {/if}
    </div>
  </div>
</section>
