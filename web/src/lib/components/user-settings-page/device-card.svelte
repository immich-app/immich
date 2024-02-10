<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { AuthDeviceResponseDto } from '@api';
  import { DateTime, type ToRelativeCalendarOptions } from 'luxon';
  import { createEventDispatcher } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    mdiAndroid,
    mdiApple,
    mdiAppleSafari,
    mdiMicrosoftWindows,
    mdiLinux,
    mdiGoogleChrome,
    mdiTrashCanOutline,
    mdiHelp,
  } from '@mdi/js';

  export let device: AuthDeviceResponseDto;

  const dispatcher = createEventDispatcher<{
    delete: void;
  }>();

  const options: ToRelativeCalendarOptions = {
    unit: 'days',
    locale: $locale,
  };
</script>

<div class="flex w-full flex-row">
  <!-- TODO: Device Image -->
  <div class="hidden items-center justify-center pr-2 text-immich-primary dark:text-immich-dark-primary sm:flex">
    {#if device.deviceOS === 'Android'}
      <Icon path={mdiAndroid} size="40" />
    {:else if device.deviceOS === 'iOS' || device.deviceOS === 'Mac OS'}
      <Icon path={mdiApple} size="40" />
    {:else if device.deviceOS.includes('Safari')}
      <Icon path={mdiAppleSafari} size="40" />
    {:else if device.deviceOS.includes('Windows')}
      <Icon path={mdiMicrosoftWindows} size="40" />
    {:else if device.deviceOS === 'Linux'}
      <Icon path={mdiLinux} size="40" />
    {:else if device.deviceOS === 'Chromium OS' || device.deviceType === 'Chrome' || device.deviceType === 'Chromium'}
      <Icon path={mdiGoogleChrome} size="40" />
    {:else}
      <Icon path={mdiHelp} size="40" />
    {/if}
  </div>
  <div class="flex grow flex-row justify-between gap-1 pl-4 sm:pl-0">
    <div class="flex flex-col justify-center gap-1 dark:text-white">
      <span class="text-sm">
        {#if device.deviceType || device.deviceOS}
          <span>{device.deviceOS || 'Unknown'} • {device.deviceType || 'Unknown'}</span>
        {:else}
          <span>Unknown</span>
        {/if}
      </span>
      <div class="text-sm">
        <span class="">Last seen</span>
        <span>{DateTime.fromISO(device.updatedAt).toRelativeCalendar(options)}</span>
      </div>
    </div>
    {#if !device.current}
      <div class="flex flex-col justify-center text-sm">
        <button
          on:click={() => dispatcher('delete')}
          class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
          title="Log out"
        >
          <Icon path={mdiTrashCanOutline} size="16" />
        </button>
      </div>
    {/if}
  </div>
</div>
