<script lang="ts">
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/admin-page/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/admin-page/settings/setting-switch.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { AlbumResponseDto, api, AssetResponseDto, SharedLinkResponseDto, SharedLinkType } from '@api';
  import { createEventDispatcher, onMount } from 'svelte';
  import Link from 'svelte-material-icons/Link.svelte';
  import BaseModal from '../base-modal.svelte';
  import type { ImmichDropDownOption } from '../dropdown-button.svelte';
  import DropdownButton from '../dropdown-button.svelte';
  import { notificationController, NotificationType } from '../notification/notification';

  export let shareType: SharedLinkType;
  export let sharedAssets: AssetResponseDto[] = [];
  export let album: AlbumResponseDto | undefined = undefined;
  export let editingLink: SharedLinkResponseDto | undefined = undefined;

  let sharedLink: string | null = null;
  let description = '';
  let allowDownload = true;
  let allowUpload = false;
  let showExif = true;
  let expirationTime = '';
  let shouldChangeExpirationTime = false;
  let canCopyImagesToClipboard = true;
  const dispatch = createEventDispatcher();

  const expiredDateOption: ImmichDropDownOption = {
    default: 'Never',
    options: ['Never', '30 minutes', '1 hour', '6 hours', '1 day', '7 days', '30 days'],
  };

  onMount(async () => {
    if (editingLink) {
      if (editingLink.description) {
        description = editingLink.description;
      }
      allowUpload = editingLink.allowUpload;
      allowDownload = editingLink.allowDownload;
      showExif = editingLink.showExif;
    }

    const module = await import('copy-image-clipboard');
    canCopyImagesToClipboard = module.canCopyImagesToClipboard();
  });

  const handleCreateSharedLink = async () => {
    const expirationTime = getExpirationTimeInMillisecond();
    const currentTime = new Date().getTime();
    const expirationDate = expirationTime ? new Date(currentTime + expirationTime).toISOString() : undefined;

    try {
      const { data } = await api.sharedLinkApi.createSharedLink({
        sharedLinkCreateDto: {
          type: shareType,
          albumId: album ? album.id : undefined,
          assetIds: sharedAssets.map((a) => a.id),
          expiresAt: expirationDate,
          allowUpload,
          description,
          allowDownload,
          showExif,
        },
      });
      sharedLink = `${window.location.origin}/share/${data.key}`;
    } catch (e) {
      handleError(e, 'Failed to create shared link');
    }
  };

  const handleCopy = async () => {
    if (!sharedLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(sharedLink);
      notificationController.show({ message: 'Copied to clipboard!', type: NotificationType.Info });
    } catch (e) {
      handleError(e, 'Cannot copy to clipboard, make sure you are accessing the page through https');
    }
  };

  const getExpirationTimeInMillisecond = () => {
    switch (expirationTime) {
      case '30 minutes':
        return 30 * 60 * 1000;
      case '1 hour':
        return 60 * 60 * 1000;
      case '6 hours':
        return 6 * 60 * 60 * 1000;
      case '1 day':
        return 24 * 60 * 60 * 1000;
      case '7 days':
        return 7 * 24 * 60 * 60 * 1000;
      case '30 days':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  const handleEditLink = async () => {
    if (!editingLink) {
      return;
    }

    try {
      const expirationTime = getExpirationTimeInMillisecond();
      const currentTime = new Date().getTime();
      const expirationDate: string | null = expirationTime
        ? new Date(currentTime + expirationTime).toISOString()
        : null;

      await api.sharedLinkApi.updateSharedLink({
        id: editingLink.id,
        sharedLinkEditDto: {
          description,
          expiresAt: shouldChangeExpirationTime ? expirationDate : undefined,
          allowUpload: allowUpload,
          allowDownload: allowDownload,
          showExif: showExif,
        },
      });

      notificationController.show({
        type: NotificationType.Info,
        message: 'Edited',
      });

      dispatch('close');
    } catch (e) {
      handleError(e, 'Failed to edit shared link');
    }
  };
</script>

<BaseModal on:close={() => dispatch('close')}>
  <svelte:fragment slot="title">
    <span class="flex gap-2 place-items-center">
      <Link size={24} />
      {#if editingLink}
        <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Edit link</p>
      {:else}
        <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Create link to share</p>
      {/if}
    </span>
  </svelte:fragment>

  <section class="mx-6 mb-6">
    {#if shareType == SharedLinkType.Album}
      {#if !editingLink}
        <div>Let anyone with the link see photos and people in this album.</div>
      {:else}
        <div class="text-sm">
          Public album | <span class="text-immich-primary dark:text-immich-dark-primary"
            >{editingLink.album?.albumName}</span
          >
        </div>
      {/if}
    {/if}

    {#if shareType == SharedLinkType.Individual}
      {#if !editingLink}
        <div>Let anyone with the link see the selected photo(s)</div>
      {:else}
        <div class="text-sm">
          Individual shared | <span class="text-immich-primary dark:text-immich-dark-primary"
            >{editingLink.description}</span
          >
        </div>
      {/if}
    {/if}

    <div class="mt-4 mb-2">
      <p class="text-xs">LINK OPTIONS</p>
    </div>
    <div class="p-4 bg-gray-100 dark:bg-black/40 rounded-lg">
      <div class="flex flex-col">
        <div class="mb-2">
          <SettingInputField inputType={SettingInputFieldType.TEXT} label="Description" bind:value={description} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={showExif} title={'Show metadata'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={allowDownload} title={'Allow public user to download'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={allowUpload} title={'Allow public user to upload'} />
        </div>

        <div class="text-sm">
          {#if editingLink}
            <p class="my-2 immich-form-label">
              <SettingSwitch bind:checked={shouldChangeExpirationTime} title={'Change expiration time'} />
            </p>
          {:else}
            <p class="my-2 immich-form-label">Expire after</p>
          {/if}

          <DropdownButton
            options={expiredDateOption}
            bind:selected={expirationTime}
            disabled={editingLink && !shouldChangeExpirationTime}
          />
        </div>
      </div>
    </div>
  </section>

  <hr />

  <section class="m-6">
    {#if !sharedLink}
      {#if editingLink}
        <div class="flex justify-end">
          <Button size="sm" rounded="lg" on:click={handleEditLink}>Confirm</Button>
        </div>
      {:else}
        <div class="flex justify-end">
          <Button size="sm" rounded="lg" on:click={handleCreateSharedLink}>Create link</Button>
        </div>
      {/if}
    {:else}
      <div class="flex w-full gap-4">
        <input class="immich-form-input w-full" bind:value={sharedLink} disabled />

        {#if canCopyImagesToClipboard}
          <Button on:click={() => handleCopy()}>Copy</Button>
        {/if}
      </div>
    {/if}
  </section>
</BaseModal>
