<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { user as userStore } from '$lib/stores/user.store';
  import { subscribeToSharedLink, type SharedLinkResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody, toastManager } from '@immich/ui';
  import { mdiAccount, mdiCheck } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
    onClose: () => void;
  }

  let { sharedLink, onClose }: Props = $props();

  const user = $derived($userStore);

  const handleLogin = () => {
    onClose();
    // Navigate to login page with return URL including the shared link
    const currentPath = $page.url.pathname + $page.url.search;
    const returnUrl = encodeURIComponent(currentPath);
    goto(`/auth/login?returnUrl=${returnUrl}`);
  };

  const handleConfirmSubscribe = async () => {
    if (!user) return;

    try {
      // Use the subscribe endpoint which now handles logged-in users
      // Send empty DTO since backend will use auth.user
      await subscribeToSharedLink({
        key: sharedLink.key,
        sharedLinkSubscribeDto: {
          subscriberUserId: user.id,
        },
      });
      toastManager.success($t('asset_added_to_album'));
      onClose();
      // Force a hard reload to get fresh album data
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to add user to album:', error);
      // Try to extract the actual error message from the response
      let errorMessage = error?.message || $t('admin.error_adding_users_to_album');
      if (error?.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData?.message || errorMessage;
          console.error('Server error details:', errorData);

          // If user is already a member, treat it as success
          if (errorData?.message?.includes('already a member')) {
            toastManager.info('You are already a member of this album');
            onClose();
            window.location.reload();
            return;
          }
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
      }
      toastManager.show({
        message: errorMessage,
        type: 'error',
      });
    }
  };
</script>

<Modal size="small" title={$t('subscribe_to_album')} icon={mdiAccount} {onClose}>
  <ModalBody>
    <div class="flex flex-col gap-4">
      <p class="text-sm dark:text-immich-dark-fg">
        {#if user}
          {$t('subscribe_to_album_confirm_description')}
        {:else}
          {$t('subscribe_to_album_login_description')}
        {/if}
      </p>

      <div class="flex flex-col gap-3">
        {#if user}
          <Button fullwidth color="primary" leadingIcon={mdiCheck} onclick={handleConfirmSubscribe}>
            {$t('confirm')}
          </Button>
        {:else}
          <Button fullwidth color="primary" leadingIcon={mdiAccount} onclick={handleLogin}>
            {$t('login')}
          </Button>
        {/if}
      </div>
    </div>
  </ModalBody>

  {#snippet buttons()}
    <Button color="gray" fullwidth onclick={onClose}>{$t('cancel')}</Button>
  {/snippet}
</Modal>
