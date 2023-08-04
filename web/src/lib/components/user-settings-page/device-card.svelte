<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { AuthDeviceResponseDto } from '@api';
  import { DateTime, ToRelativeCalendarOptions } from 'luxon';
  import { createEventDispatcher } from 'svelte';
  import Android from 'svelte-material-icons/Android.svelte';
  import Apple from 'svelte-material-icons/Apple.svelte';
  import AppleSafari from 'svelte-material-icons/AppleSafari.svelte';
  import GoogleChrome from 'svelte-material-icons/GoogleChrome.svelte';
  import Help from 'svelte-material-icons/Help.svelte';
  import Linux from 'svelte-material-icons/Linux.svelte';
  import MicrosoftWindows from 'svelte-material-icons/MicrosoftWindows.svelte';
  import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';

  export let device: AuthDeviceResponseDto;

  const dispatcher = createEventDispatcher();

  const options: ToRelativeCalendarOptions = {
    unit: 'days',
    locale: $locale,
  };
</script>

<div class="flex w-full flex-row">
  <!-- TODO: Device Image -->
  <div class="hidden items-center justify-center pr-2 text-immich-primary dark:text-immich-dark-primary sm:flex">
    {#if device.deviceOS === 'Android'}
      <Android size="40" />
    {:else if device.deviceOS === 'iOS' || device.deviceOS === 'Mac OS'}
      <Apple size="40" />
    {:else if device.deviceOS.indexOf('Safari') !== -1}
      <AppleSafari size="40" />
    {:else if device.deviceOS.indexOf('Windows') !== -1}
      <MicrosoftWindows size="40" />
    {:else if device.deviceOS === 'Linux'}
      <Linux size="40" />
    {:else if device.deviceOS === 'Chromium OS' || device.deviceType === 'Chrome' || device.deviceType === 'Chromium'}
      <GoogleChrome size="40" />
    {:else}
      <Help size="40" />
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
          <TrashCanOutline size="16" />
        </button>
      </div>
    {/if}
  </div>
</div>
