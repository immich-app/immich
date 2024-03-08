<script lang="ts">
  import { goto } from '$app/navigation';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import SharedLinkCard from '$lib/components/sharedlinks-page/shared-link-card.svelte';
  import { AppRoute } from '$lib/constants';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { copyToClipboard, makeSharedLinkUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllSharedLinks, removeSharedLink, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiArrowLeft } from '@mdi/js';
  import { onMount } from 'svelte';

  let sharedLinks: SharedLinkResponseDto[] = [];
  let editSharedLink: SharedLinkResponseDto | null = null;

  let deleteLinkId: string | null = null;

  const refresh = async () => {
    sharedLinks = await getAllSharedLinks();
  };

  onMount(async () => {
    await refresh();
  });

  const handleDeleteLink = async () => {
    if (!deleteLinkId) {
      return;
    }

    try {
      await removeSharedLink({ id: deleteLinkId });
      notificationController.show({ message: 'Deleted shared link', type: NotificationType.Info });
      deleteLinkId = null;
      await refresh();
    } catch (error) {
      handleError(error, 'Unable to delete shared link');
    }
  };

  const handleEditDone = async () => {
    await refresh();
    editSharedLink = null;
  };

  const handleCopyLink = async (key: string) => {
    await copyToClipboard(makeSharedLinkUrl($serverConfig.externalDomain, key));
  };
</script>

<ControlAppBar backIcon={mdiArrowLeft} on:close={() => goto(AppRoute.SHARING)}>
  <svelte:fragment slot="leading">Shared links</svelte:fragment>
</ControlAppBar>

<section class="mt-[120px] flex flex-col pb-[120px]">
  <div class="m-auto mb-4 w-[50%] dark:text-immich-gray">
    <p>Manage shared links</p>
  </div>
  {#if sharedLinks.length === 0}
    <div
      class="m-auto flex w-[50%] place-content-center place-items-center rounded-lg bg-gray-100 dark:bg-immich-dark-gray dark:text-immich-gray p-12"
    >
      <p>You don't have any shared links</p>
    </div>
  {:else}
    <div class="m-auto flex w-[50%] flex-col">
      {#each sharedLinks as link (link.id)}
        <SharedLinkCard
          {link}
          on:delete={() => (deleteLinkId = link.id)}
          on:edit={() => (editSharedLink = link)}
          on:copy={() => handleCopyLink(link.key)}
        />
      {/each}
    </div>
  {/if}
</section>

{#if editSharedLink}
  <CreateSharedLinkModal editingLink={editSharedLink} on:close={handleEditDone} />
{/if}

{#if deleteLinkId}
  <ConfirmDialogue
    title="Delete Shared Link"
    prompt="Are you sure you want to delete this shared link?"
    confirmText="Delete"
    onConfirm={() => handleDeleteLink()}
    onClose={() => (deleteLinkId = null)}
  />
{/if}
