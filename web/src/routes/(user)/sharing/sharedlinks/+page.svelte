<script lang="ts">
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  import { api, copyToClipboard, SharedLinkResponseDto } from '@api';
  import { goto } from '$app/navigation';
  import SharedLinkCard from '$lib/components/sharedlinks-page/shared-link-card.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { onMount } from 'svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { AppRoute } from '$lib/constants';

  let sharedLinks: SharedLinkResponseDto[] = [];
  let editSharedLink: SharedLinkResponseDto | null = null;

  let deleteLinkId: string | null = null;

  const refresh = async () => {
    const { data } = await api.sharedLinkApi.getAllSharedLinks();
    sharedLinks = data;
  };

  onMount(async () => {
    await refresh();
  });

  const handleDeleteLink = async () => {
    if (!deleteLinkId) {
      return;
    }

    try {
      await api.sharedLinkApi.removeSharedLink({ id: deleteLinkId });
      notificationController.show({ message: 'Deleted shared link', type: NotificationType.Info });
      deleteLinkId = null;
      await refresh();
    } catch (error) {
      await handleError(error, 'Unable to delete shared link');
    }
  };

  const handleEditDone = async () => {
    await refresh();
    editSharedLink = null;
  };

  const handleCopyLink = async (key: string) => {
    await copyToClipboard(`${window.location.origin}/share/${key}`);
  };
</script>

<ControlAppBar backIcon={ArrowLeft} on:close-button-click={() => goto(AppRoute.SHARING)}>
  <svelte:fragment slot="leading">Shared links</svelte:fragment>
</ControlAppBar>

<section class="mt-[120px] flex flex-col pb-[120px]">
  <div class="m-auto mb-4 w-[50%] dark:text-immich-gray">
    <p>Manage shared links</p>
  </div>
  {#if sharedLinks.length === 0}
    <div class="m-auto flex w-[50%] place-content-center place-items-center rounded-lg bg-gray-100 p-12">
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
    on:confirm={() => handleDeleteLink()}
    on:cancel={() => (deleteLinkId = null)}
  />
{/if}
