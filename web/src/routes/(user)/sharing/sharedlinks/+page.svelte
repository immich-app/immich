<script lang="ts">
  import { goto } from '$app/navigation';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SharedLinkCard from '$lib/components/sharedlinks-page/shared-link-card.svelte';
  import { AppRoute } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllSharedLinks, removeSharedLink, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiArrowLeft } from '@mdi/js';
  import { onMount } from 'svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { t } from 'svelte-i18n';

  let sharedLinks: SharedLinkResponseDto[] = [];
  let editSharedLink: SharedLinkResponseDto | null = null;

  const refresh = async () => {
    sharedLinks = await getAllSharedLinks();
  };

  onMount(async () => {
    await refresh();
  });

  const handleDeleteLink = async (id: string) => {
    const isConfirmed = await dialogController.show({
      title: $t('delete_shared_link'),
      prompt: $t('confirm_delete_shared_link'),
      confirmText: $t('delete'),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await removeSharedLink({ id });
      notificationController.show({ message: $t('deleted_shared_link'), type: NotificationType.Info });
      await refresh();
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_shared_link'));
    }
  };

  const handleEditDone = async () => {
    await refresh();
    editSharedLink = null;
  };
</script>

<ControlAppBar backIcon={mdiArrowLeft} onClose={() => goto(AppRoute.SHARING)}>
  <svelte:fragment slot="leading">{$t('shared_links')}</svelte:fragment>
</ControlAppBar>

<section class="mt-[120px] flex flex-col pb-[120px] container max-w-screen-lg mx-auto px-3">
  <div class="mb-4 dark:text-immich-gray">
    <p>{$t('manage_shared_links')}</p>
  </div>
  {#if sharedLinks.length === 0}
    <div
      class="flex place-content-center place-items-center rounded-lg bg-gray-100 dark:bg-immich-dark-gray dark:text-immich-gray p-12"
    >
      <p>{$t('you_dont_have_any_shared_links')}</p>
    </div>
  {:else}
    <div class="flex flex-col">
      {#each sharedLinks as link (link.id)}
        <SharedLinkCard {link} onDelete={() => handleDeleteLink(link.id)} onEdit={() => (editSharedLink = link)} />
      {/each}
    </div>
  {/if}
</section>

{#if editSharedLink}
  <CreateSharedLinkModal editingLink={editSharedLink} onClose={handleEditDone} />
{/if}
