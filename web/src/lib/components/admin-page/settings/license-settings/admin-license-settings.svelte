<script lang="ts">
  import {
    deleteServerLicense,
    deleteUserLicense,
    getAboutInfo,
    getMyUser,
    getServerLicense,
    type LicenseResponseDto,
    type SystemConfigDto,
  } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { fade } from 'svelte/transition';
  import type { SettingsResetEvent, SettingsSaveEvent } from '../admin-settings';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import SettingButtonsRow from '$lib/components/shared-components/settings/setting-buttons-row.svelte';
  import { t } from 'svelte-i18n';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import LicenseContent from '$lib/components/shared-components/license/license-content.svelte';
  import { licenseStore } from '$lib/stores/license.store';
  import { user } from '$lib/stores/user.store';
  import { getAccountAge } from '$lib/utils/auth';
  import { handleError } from '$lib/utils/handle-error';
  import { mdiLicense } from '@mdi/js';
  import { onMount } from 'svelte';

  export let savedConfig: SystemConfigDto;
  export let defaultConfig: SystemConfigDto;
  export let config: SystemConfigDto; // this is the config that is being edited
  export let disabled = false;
  export let onReset: SettingsResetEvent;
  export let onSave: SettingsSaveEvent;

  const { isLicenseActivated } = licenseStore;
  let isServerLicense = false;
  let serverLicenseInfo: LicenseResponseDto | null = null;
  const accountAge = getAccountAge();

  const checkLicenseInfo = async () => {
    const serverInfo = await getAboutInfo();
    isServerLicense = serverInfo.licensed;

    const userInfo = await getMyUser();
    if (userInfo.license) {
      $user = { ...$user, license: userInfo.license };
    }

    if (isServerLicense && $user.isAdmin) {
      serverLicenseInfo = (await getServerLicense()) as LicenseResponseDto | null;
    }
  };

  onMount(async () => {
    if (!$isLicenseActivated) {
      return;
    }

    await checkLicenseInfo();
  });

  const removeUserLicense = async () => {
    try {
      const isConfirmed = await dialogController.show({
        title: 'Remove License',
        prompt: 'Are you sure you want to remove the license?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
      });

      if (!isConfirmed) {
        return;
      }

      await deleteUserLicense();
      licenseStore.setLicenseStatus(false);
    } catch (error) {
      handleError(error, 'Failed to remove license');
    }
  };

  const removeServerLicense = async () => {
    try {
      const isConfirmed = await dialogController.show({
        title: 'Remove License',
        prompt: 'Are you sure you want to remove the Server license?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
      });

      if (!isConfirmed) {
        return;
      }

      await deleteServerLicense();
      licenseStore.setLicenseStatus(false);
    } catch (error) {
      handleError(error, 'Failed to remove license');
    }
  };

  const onLicenseActivated = async () => {
    licenseStore.setLicenseStatus(true);
    await checkLicenseInfo();
  };
</script>

<div>
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" on:submit|preventDefault>
      <div class="ml-4 mt-4 flex flex-col gap-4">
        <SettingSwitch title={'Show license panel'} {disabled} bind:checked={config.license.showLicensePanel} />

        <hr />

        <SettingButtonsRow
          onReset={(options) => onReset({ ...options, configKeys: ['license'] })}
          onSave={() => onSave({ license: config.license })}
          showResetToDefault={!isEqual(savedConfig.license, defaultConfig.license)}
          {disabled}
        />
      </div>
    </form>

    <section class="my-4">
      <hr class="my-4" />
      <div in:fade={{ duration: 500 }}>
        {#if $isLicenseActivated}
          {#if isServerLicense}
            <div
              class="bg-gray-50 border border-immich-dark-primary/50 dark:bg-immich-dark-primary/15 p-6 pr-12 rounded-xl flex place-content-center gap-4"
            >
              <Icon path={mdiLicense} size="56" class="text-immich-primary dark:text-immich-dark-primary" />

              <div>
                <p class="text-immich-primary dark:text-immich-dark-primary font-semibold text-lg">Server License</p>

                {#if $user.isAdmin && serverLicenseInfo?.activatedAt}
                  <p class="dark:text-white text-sm mt-1 col-start-2">
                    Activated on {new Date(serverLicenseInfo?.activatedAt).toLocaleDateString()}
                  </p>
                {:else}
                  <p class="dark:text-white">Your license is managed by the admin</p>
                {/if}
              </div>
            </div>

            {#if $user.isAdmin}
              <div class="text-right mt-4">
                <Button size="sm" color="red" on:click={removeServerLicense}>Remove license</Button>
              </div>
            {/if}
          {:else}
            <div
              class="bg-gray-50 border border-immich-dark-primary/50 dark:bg-immich-dark-primary/15 p-6 pr-12 rounded-xl flex place-content-center gap-4"
            >
              <Icon path={mdiLicense} size="56" class="text-immich-primary dark:text-immich-dark-primary" />

              <div>
                <p class="text-immich-primary dark:text-immich-dark-primary font-semibold text-lg">
                  Individual License
                </p>
                {#if $user.license?.activatedAt}
                  <p class="dark:text-white text-sm mt-1 col-start-2">
                    Activated on {new Date($user.license?.activatedAt).toLocaleDateString()}
                  </p>
                {/if}
              </div>
            </div>

            <div class="text-right mt-4">
              <Button size="sm" color="red" on:click={removeUserLicense}>Remove license</Button>
            </div>
          {/if}
        {:else}
          {#if accountAge > 14}
            <div
              class="text-center bg-gray-100 border border-immich-dark-primary/50 dark:bg-immich-dark-primary/15 p-4 rounded-xl"
            >
              <p class="text-immich-dark-gray/80 dark:text-immich-gray text-balance">
                {$t('license_trial_info_2')}
                <span class="text-immich-primary dark:text-immich-dark-primary font-semibold">
                  {$t('license_trial_info_3', { values: { accountAge } })}</span
                >. {$t('license_trial_info_4')}
              </p>
            </div>
          {/if}
          <LicenseContent onActivate={onLicenseActivated} />
        {/if}
      </div>
    </section>
  </div>
</div>
