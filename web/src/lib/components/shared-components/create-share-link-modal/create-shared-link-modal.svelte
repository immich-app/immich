<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { copyToClipboard, makeSharedLinkUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { SharedLinkType, createSharedLink, updateSharedLink, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiContentCopy, mdiLink } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import type { ImmichDropDownOption } from '../dropdown-button.svelte';
  import DropdownButton from '../dropdown-button.svelte';
  import { NotificationType, notificationController } from '../notification/notification';
  import SettingInputField, { SettingInputFieldType } from '../settings/setting-input-field.svelte';
  import SettingSwitch from '../settings/setting-switch.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';

  export let onClose: () => void;
  export let albumId: string | undefined = undefined;
  export let assetIds: string[] = [];
  export let editingLink: SharedLinkResponseDto | undefined = undefined;

  let sharedLink: string | null = null;
  let description = '';
  let allowDownload = true;
  let allowUpload = false;
  let showMetadata = true;
  let expirationTime = '';
  let password = '';
  let shouldChangeExpirationTime = false;
  let enablePassword = false;

  const dispatch = createEventDispatcher<{
    created: void;
  }>();

  const expiredDateOption: ImmichDropDownOption = {
    default: 'Never',
    options: ['Never', '30 minutes', '1 hour', '6 hours', '1 day', '7 days', '30 days', '3 months', '1 year'],
  };

  $: shareType = albumId ? SharedLinkType.Album : SharedLinkType.Individual;

  if (editingLink) {
    if (editingLink.description) {
      description = editingLink.description;
    }
    if (editingLink.password) {
      password = editingLink.password;
    }
    allowUpload = editingLink.allowUpload;
    allowDownload = editingLink.allowDownload;
    showMetadata = editingLink.showMetadata;

    albumId = editingLink.album?.id;
    assetIds = editingLink.assets.map(({ id }) => id);

    enablePassword = !!editingLink.password;
  }

  const handleCreateSharedLink = async () => {
    const expirationTime = getExpirationTimeInMillisecond();
    const currentTime = Date.now();
    const expirationDate = expirationTime ? new Date(currentTime + expirationTime).toISOString() : undefined;

    try {
      const data = await createSharedLink({
        sharedLinkCreateDto: {
          type: shareType,
          albumId,
          assetIds,
          expiresAt: expirationDate,
          allowUpload,
          description,
          password,
          allowDownload,
          showMetadata,
        },
      });
      sharedLink = makeSharedLinkUrl($serverConfig.externalDomain, data.key);
      dispatch('created');
    } catch (error) {
      handleError(error, 'Failed to create shared link');
    }
  };

  const getExpirationTimeInMillisecond = () => {
    switch (expirationTime) {
      case '30 minutes': {
        return 30 * 60 * 1000;
      }
      case '1 hour': {
        return 60 * 60 * 1000;
      }
      case '6 hours': {
        return 6 * 60 * 60 * 1000;
      }
      case '1 day': {
        return 24 * 60 * 60 * 1000;
      }
      case '7 days': {
        return 7 * 24 * 60 * 60 * 1000;
      }
      case '30 days': {
        return 30 * 24 * 60 * 60 * 1000;
      }
      case '3 months': {
        return 30 * 24 * 60 * 60 * 3 * 1000;
      }
      case '1 year': {
        return 30 * 24 * 60 * 60 * 12 * 1000;
      }
      default: {
        return 0;
      }
    }
  };

  const handleEditLink = async () => {
    if (!editingLink) {
      return;
    }

    try {
      const expirationTime = getExpirationTimeInMillisecond();
      const currentTime = Date.now();
      const expirationDate: string | null = expirationTime
        ? new Date(currentTime + expirationTime).toISOString()
        : null;

      await updateSharedLink({
        id: editingLink.id,
        sharedLinkEditDto: {
          description,
          password: enablePassword ? password : '',
          expiresAt: shouldChangeExpirationTime ? expirationDate : undefined,
          allowUpload,
          allowDownload,
          showMetadata,
        },
      });

      notificationController.show({
        type: NotificationType.Info,
        message: 'Edited',
      });

      onClose();
    } catch (error) {
      handleError(error, 'Failed to edit shared link');
    }
  };

  const getTitle = () => {
    if (editingLink) {
      return 'Edit link';
    }
    return 'Create link to share';
  };
</script>

<FullScreenModal title={getTitle()} icon={mdiLink} {onClose}>
  <section>
    {#if shareType === SharedLinkType.Album}
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

    {#if shareType === SharedLinkType.Individual}
      {#if !editingLink}
        <div>Let anyone with the link see the selected photo(s)</div>
      {:else}
        <div class="text-sm">
          Individual shared | <span class="text-immich-primary dark:text-immich-dark-primary"
            >{editingLink.description || ''}</span
          >
        </div>
      {/if}
    {/if}

    <div class="mb-2 mt-4">
      <p class="text-xs">LINK OPTIONS</p>
    </div>
    <div class="rounded-lg bg-gray-100 p-4 dark:bg-black/40 overflow-y-auto">
      <div class="flex flex-col">
        <div class="mb-2">
          <SettingInputField inputType={SettingInputFieldType.TEXT} label="Description" bind:value={description} />
        </div>

        <div class="mb-2">
          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label="Password"
            bind:value={password}
            disabled={!enablePassword}
          />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={enablePassword} title={'Require password'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={showMetadata} title={'Show metadata'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={allowDownload} title={'Allow public user to download'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={allowUpload} title={'Allow public user to upload'} />
        </div>

        <div class="text-sm">
          {#if editingLink}
            <p class="immich-form-label my-2">
              <SettingSwitch bind:checked={shouldChangeExpirationTime} title={'Change expiration time'} />
            </p>
          {:else}
            <p class="immich-form-label my-2">Expire after</p>
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

  <svelte:fragment slot="sticky-bottom">
    {#if !sharedLink}
      {#if editingLink}
        <Button size="sm" fullwidth on:click={handleEditLink}>Confirm</Button>
      {:else}
        <Button size="sm" fullwidth on:click={handleCreateSharedLink}>Create link</Button>
      {/if}
    {:else}
      <div class="flex w-full gap-2">
        <input class="immich-form-input w-full" bind:value={sharedLink} disabled />
        <LinkButton on:click={() => (sharedLink ? copyToClipboard(sharedLink) : '')}>
          <div class="flex place-items-center gap-2 text-sm">
            <Icon path={mdiContentCopy} ariaLabel="Copy link to clipboard" size="18" />
          </div>
        </LinkButton>
      </div>
    {/if}
  </svelte:fragment>
</FullScreenModal>
