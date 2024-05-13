<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import type { SessionResponseDto } from '@immich/sdk';
  import {
    mdiAndroid,
    mdiApple,
    mdiAppleSafari,
    mdiGoogleChrome,
    mdiHelp,
    mdiLinux,
    mdiMicrosoftWindows,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { DateTime, type ToRelativeCalendarOptions } from 'luxon';
  import { createEventDispatcher } from 'svelte';

  export let device: SessionResponseDto;

  const dispatcher = createEventDispatcher<{
    delete: void;
  }>();

  const options: ToRelativeCalendarOptions = {
    unit: 'days',
    locale: $locale,
  };
</script>

<div class="flex w-full flex-row">
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
        <span>{DateTime.fromISO(device.updatedAt, { locale: $locale }).toRelativeCalendar(options)}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400"> - </span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {DateTime.fromISO(device.updatedAt, { locale: $locale }).toLocaleString(DateTime.DATETIME_MED)}
        </span>
      </div>
    </div>
    {#if !device.current}
      <div>
        <CircleIconButton
          color="primary"
          icon={mdiTrashCanOutline}
          title="Log out"
          size="16"
          on:click={() => dispatcher('delete')}
        />
      </div>
    {/if}
  </div>
</div>
