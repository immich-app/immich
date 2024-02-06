<script lang="ts">
  import { api, type UserResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { notificationController, NotificationType } from '../shared-components/notification/notification';
  import Button from '../elements/buttons/button.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiAccountEditOutline, mdiClose } from '@mdi/js';
  import { AppRoute } from '$lib/constants';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { convertFromBytes, convertToBytes } from '$lib/utils/byte-converter';
  import { serverInfo } from '$lib/stores/server-info.store';

  export let user: UserResponseDto;
  export let canResetPassword = true;

  let error: string;
  let success: string;
  let isShowResetPasswordConfirmation = false;
  let quotaSize = user.quotaSizeInBytes ? convertFromBytes(user.quotaSizeInBytes, 'GiB') : null;

  const previousQutoa = user.quotaSizeInBytes;

  $: quotaSizeWarning =
    previousQutoa !== convertToBytes(Number(quotaSize), 'GiB') &&
    !!quotaSize &&
    convertToBytes(Number(quotaSize), 'GiB') > $serverInfo.diskSizeRaw;

  const dispatch = createEventDispatcher<{
    close: void;
    resetPasswordSuccess: void;
    editSuccess: void;
  }>();

  const editUser = async () => {
    try {
      const { id, email, name, storageLabel, externalPath } = user;
      const { status } = await api.userApi.updateUser({
        updateUserDto: {
          id,
          email,
          name,
          storageLabel: storageLabel || '',
          externalPath: externalPath || '',
          quotaSizeInBytes: quotaSize ? convertToBytes(Number(quotaSize), 'GiB') : null,
        },
      });

      if (status === 200) {
        dispatch('editSuccess');
      }
    } catch (error) {
      handleError(error, "Impossible de créer l'utilisateur");
    }
  };

  const resetPassword = async () => {
    try {
      const defaultPassword = 'password';

      const { status } = await api.userApi.updateUser({
        updateUserDto: {
          id: user.id,
          password: defaultPassword,
          shouldChangePassword: true,
        },
      });

      if (status == 200) {
        dispatch('resetPasswordSuccess');
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du mot de passe de l'utilisateur", error);
      notificationController.show({
        message: "Erreur lors de la réinitialisation du mot de passe de l'utilisateur, contactez votre admnistrateur",
        type: NotificationType.Error,
      });
    } finally {
      isShowResetPasswordConfirmation = false;
    }
  };
</script>

<div
  class="relative max-h-screen w-[500px] max-w-[95vw] overflow-y-auto rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
>
  <div class="absolute top-0 right-0 px-2 py-2 h-fit">
    <CircleIconButton icon={mdiClose} on:click={() => dispatch('close')} />
  </div>

  <div
    class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
  >
    <Icon path={mdiAccountEditOutline} size="4em" />
    <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Editer l'utilisateur</h1>
  </div>

  <form on:submit|preventDefault={editUser} autocomplete="off">
    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="email">Email</label>
      <input class="immich-form-input" id="email" name="email" type="email" bind:value={user.email} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="name">Nom</label>
      <input class="immich-form-input" id="name" name="name" type="text" required bind:value={user.name} />
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="flex items-center gap-2 immich-form-label" for="quotaSize"
        >Taille du quota (GiB) {#if quotaSizeWarning}
          <p class="text-red-400 text-sm">Votre quota est supérieur à la taille du disque</p>
        {/if}</label
      >
      <input class="immich-form-input" id="quotaSize" name="quotaSize" type="number" min="0" bind:value={quotaSize} />
      <p>Note: Entrer 0 pour un quota illimité</p>
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="storage-label">Nom du stockage</label>
      <input
        class="immich-form-input"
        id="storage-label"
        name="storage-label"
        type="text"
        bind:value={user.storageLabel}
      />

      <p>
        Note : Pour appliquer l'étiquette de stockage aux ressources déjà téléchargées, exécutez le
        <a href={AppRoute.ADMIN_JOBS} class="text-immich-primary dark:text-immich-dark-primary">
          Job de migration du stockage</a
        >
      </p>
    </div>

    <div class="m-4 flex flex-col gap-2">
      <label class="immich-form-label" for="external-path">Chemin externe</label>
      <input
        class="immich-form-input"
        id="external-path"
        name="external-path"
        type="text"
        bind:value={user.externalPath}
      />

      <p>
        Remarque : Chemin absolu du répertoire parent d'importation. Un utilisateur ne peut importer des fichiers
         que s'ils existent à cet emplacement ou en dessous de celui-ci
      </p>
    </div>

    {#if error}
      <p class="ml-4 text-sm text-red-400">{error}</p>
    {/if}

    {#if success}
      <p class="ml-4 text-sm text-immich-primary">{success}</p>
    {/if}
    <div class="mt-8 flex w-full gap-4 px-4">
      {#if canResetPassword}
        <Button color="light-red" fullwidth on:click={() => (isShowResetPasswordConfirmation = true)}
          >Reinitialiser le mot de passe</Button
        >
      {/if}
      <Button type="submit" fullwidth>Confirmer</Button>
    </div>
  </form>
</div>

{#if isShowResetPasswordConfirmation}
  <ConfirmDialogue
    title="Reset Password"
    confirmText="Reset"
    on:confirm={resetPassword}
    on:cancel={() => (isShowResetPasswordConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>
        Êtes-vous sûr de vouloir réinitialiser le mot de passe de <b>{user.name}</b> ?
      </p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
