<script lang="ts">
  import { fade } from 'svelte/transition';

  import { onMount } from 'svelte';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import { user } from '$lib/stores/user.store';
  import {
    deleteServerLicense as deleteServerProductKey,
    deleteUserLicense as deleteIndividualProductKey,
    getAboutInfo,
    getMyUser,
    getServerLicense,
    isHttpError,
    type LicenseResponseDto,
  } from '@immich/sdk';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiLicense } from '@mdi/js';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { handleError } from '$lib/utils/handle-error';
  import PurchaseContent from '$lib/components/shared-components/purchasing/purchase-content.svelte';
  import { t } from 'svelte-i18n';
  import { getAccountAge } from '$lib/utils/auth';
  const { isPurchased } = purchaseStore;

  let isServerProduct = false;
  let serverPurchaseInfo: LicenseResponseDto | null = null;

  const checkPurchaseInfo = async () => {
    const serverInfo = await getAboutInfo();
    isServerProduct = serverInfo.licensed;

    const userInfo = await getMyUser();
    if (userInfo.license) {
      $user = { ...$user, license: userInfo.license };
    }

    if (isServerProduct && $user.isAdmin) {
      serverPurchaseInfo = await getServerPurchaseInfo();
    }
  };

  const getServerPurchaseInfo = async () => {
    try {
      return await getServerLicense();
    } catch (error) {
      if (isHttpError(error) && error.status === 404) {
        return null;
      }
      throw error;
    }
  };

  onMount(async () => {
    if (!$isPurchased) {
      return;
    }

    await checkPurchaseInfo();
  });

  const removeIndividualProductKey = async () => {
    try {
      const isConfirmed = await dialogController.show({
        title: 'Remove Product Key',
        prompt: 'Are you sure you want to remove the product key?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
      });

      if (!isConfirmed) {
        return;
      }

      await deleteIndividualProductKey();
      purchaseStore.setPurchaseStatus(false);
    } catch (error) {
      handleError(error, 'Failed to remove product key');
    }
  };

  const removeServerProductKey = async () => {
    try {
      const isConfirmed = await dialogController.show({
        title: 'Remove License',
        prompt: 'Are you sure you want to remove the Server product key?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
      });

      if (!isConfirmed) {
        return;
      }

      await deleteServerProductKey();
      purchaseStore.setPurchaseStatus(false);
    } catch (error) {
      handleError(error, 'Failed to remove product key');
    }
  };

  const onProductActivated = async () => {
    purchaseStore.setPurchaseStatus(true);
    await checkPurchaseInfo();
  };
</script>

<section class="my-4">
  <div in:fade={{ duration: 500 }}>
    {#if $isPurchased}
      {#if isServerProduct}
        <div
          class="bg-gray-50 border border-immich-dark-primary/50 dark:bg-immich-dark-primary/15 p-6 pr-12 rounded-xl flex place-content-center gap-4"
        >
          <Icon path={mdiLicense} size="56" class="text-immich-primary dark:text-immich-dark-primary" />

          <div>
            <p class="text-immich-primary dark:text-immich-dark-primary font-semibold text-lg">Server</p>

            {#if $user.isAdmin && serverPurchaseInfo?.activatedAt}
              <p class="dark:text-white text-sm mt-1 col-start-2">
                Activated on {new Date(serverPurchaseInfo?.activatedAt).toLocaleDateString()}
              </p>
            {:else}
              <p class="dark:text-white">Your product key is managed by the admin</p>
            {/if}
          </div>
        </div>

        {#if $user.isAdmin}
          <div class="text-right mt-4">
            <Button size="sm" color="red" on:click={removeServerProductKey}>Remove key</Button>
          </div>
        {/if}
      {:else}
        <div
          class="bg-gray-50 border border-immich-dark-primary/50 dark:bg-immich-dark-primary/15 p-6 pr-12 rounded-xl flex place-content-center gap-4"
        >
          <Icon path={mdiLicense} size="56" class="text-immich-primary dark:text-immich-dark-primary" />

          <div>
            <p class="text-immich-primary dark:text-immich-dark-primary font-semibold text-lg">Individual</p>
            {#if $user.license?.activatedAt}
              <p class="dark:text-white text-sm mt-1 col-start-2">
                Activated on {new Date($user.license?.activatedAt).toLocaleDateString()}
              </p>
            {/if}
          </div>
        </div>

        <div class="text-right mt-4">
          <Button size="sm" color="red" on:click={removeIndividualProductKey}>Remove key</Button>
        </div>
      {/if}
    {:else}
      <PurchaseContent onActivate={onProductActivated} showTitle={false} />
    {/if}
  </div>
</section>
