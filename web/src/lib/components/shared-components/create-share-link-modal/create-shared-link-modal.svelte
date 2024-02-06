<script lang="ts">
  import SettingInputField, {
    SettingInputFieldType,
  } from '$lib/components/admin-page/settings/setting-input-field.svelte';
  import SettingSwitch from '$lib/components/admin-page/settings/setting-switch.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { api, copyToClipboard, makeSharedLinkUrl, type SharedLinkResponseDto, SharedLinkType } from '@api';
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import BaseModal from '../base-modal.svelte';
  import type { ImmichDropDownOption } from '../dropdown-button.svelte';
  import DropdownButton from '../dropdown-button.svelte';
  import { notificationController, NotificationType } from '../notification/notification';
  import { mdiLink } from '@mdi/js';
  import { serverConfig } from '$lib/stores/server-config.store';

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
  let canCopyImagesToClipboard = true;
  let enablePassword = false;

  const dispatch = createEventDispatcher<{
    close: void;
    escape: void;
  }>();

  const expiredDateOption: ImmichDropDownOption = {
    default: 'Jamais',
    options: ['Jamais', '30 minutes', '1 heure', '6 heures', '1 jour', '7 jours', '30 jours'],
  };

  $: shareType = albumId ? SharedLinkType.Album : SharedLinkType.Individual;

  onMount(async () => {
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

    const module = await import('copy-image-clipboard');
    canCopyImagesToClipboard = module.canCopyImagesToClipboard();
  });

  const handleCreateSharedLink = async () => {
    const expirationTime = getExpirationTimeInMillisecond();
    const currentTime = Date.now();
    const expirationDate = expirationTime ? new Date(currentTime + expirationTime).toISOString() : undefined;

    try {
      const { data } = await api.sharedLinkApi.createSharedLink({
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
    } catch (error) {
      handleError(error, 'Impossible de créer le lien partagé');
    }
  };

  const handleCopy = async () => {
    if (!sharedLink) {
      return;
    }

    await copyToClipboard(sharedLink);
  };

  const getExpirationTimeInMillisecond = () => {
    switch (expirationTime) {
      case '30 minutes': {
        return 30 * 60 * 1000;
      }
      case '1 heure': {
        return 60 * 60 * 1000;
      }
      case '6 heures': {
        return 6 * 60 * 60 * 1000;
      }
      case '1 jour': {
        return 24 * 60 * 60 * 1000;
      }
      case '7 jours': {
        return 7 * 24 * 60 * 60 * 1000;
      }
      case '30 jours': {
        return 30 * 24 * 60 * 60 * 1000;
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

      await api.sharedLinkApi.updateSharedLink({
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
        message: 'Edité',
      });

      dispatch('close');
    } catch (error) {
      handleError(error, "Impossible d'éditer le lien partagé");
    }
  };
</script>

<BaseModal on:close={() => dispatch('close')} on:escape={() => dispatch('escape')}>
  <svelte:fragment slot="title">
    <span class="flex place-items-center gap-2">
      <Icon path={mdiLink} size={24} />
      {#if editingLink}
        <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Éditer le lien</p>
      {:else}
        <p class="font-medium text-immich-fg dark:text-immich-dark-fg">Créer un lien de partage</p>
      {/if}
    </span>
  </svelte:fragment>

  <section class="mx-6 mb-6">
    {#if shareType === SharedLinkType.Album}
      {#if !editingLink}
        <div>Permettez à quiconque disposant du lien de voir les photos et les personnes de cet album</div>
      {:else}
        <div class="text-sm">
          Album public | <span class="text-immich-primary dark:text-immich-dark-primary"
            >{editingLink.album?.albumName}</span
          >
        </div>
      {/if}
    {/if}

    {#if shareType === SharedLinkType.Individual}
      {#if !editingLink}
        <div>Permettez à quiconque disposant du lien de voir les photos séléctionnés</div>
      {:else}
        <div class="text-sm">
          Partage individuel | <span class="text-immich-primary dark:text-immich-dark-primary"
            >{editingLink.description || ''}</span
          >
        </div>
      {/if}
    {/if}

    <div class="mb-2 mt-4">
      <p class="text-xs">Options de lien</p>
    </div>
    <div class="rounded-lg bg-gray-100 p-4 dark:bg-black/40 overflow-y-auto">
      <div class="flex flex-col">
        <div class="mb-2">
          <SettingInputField inputType={SettingInputFieldType.TEXT} label="Description" bind:value={description} />
        </div>

        <div class="mb-2">
          <SettingInputField
            inputType={SettingInputFieldType.TEXT}
            label="Mot de passe"
            bind:value={password}
            disabled={!enablePassword}
          />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={enablePassword} title={'Nécessite un mot de passe'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={showMetadata} title={'Métadonnées visibles'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={allowDownload} title={'Autoriser les utilisateurs publics à télécharger'} />
        </div>

        <div class="my-3">
          <SettingSwitch bind:checked={allowUpload} title={'Autoriser les utilisateurs publics à uploader'} />
        </div>

        <div class="text-sm">
          {#if editingLink}
            <p class="immich-form-label my-2">
              <SettingSwitch bind:checked={shouldChangeExpirationTime} title={"Changer l'expiration"} />
            </p>
          {:else}
            <p class="immich-form-label my-2">Expire après</p>
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

  <section slot="sticky-bottom">
    {#if !sharedLink}
      {#if editingLink}
        <div class="flex justify-end">
          <Button size="sm" rounded="lg" on:click={handleEditLink}>Confirmer</Button>
        </div>
      {:else}
        <div class="flex justify-end">
          <Button size="sm" rounded="lg" on:click={handleCreateSharedLink}>Créer le lien</Button>
        </div>
      {/if}
    {:else}
      <div class="flex w-full gap-4">
        <input class="immich-form-input w-full" bind:value={sharedLink} disabled />

        {#if canCopyImagesToClipboard}
          <Button on:click={() => handleCopy()}>Copier</Button>
        {/if}
      </div>
    {/if}
  </section>
</BaseModal>
