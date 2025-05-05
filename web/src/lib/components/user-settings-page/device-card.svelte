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
    mdiUbuntu,
  } from '@mdi/js';
  import { DateTime, type ToRelativeCalendarOptions } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    device: SessionResponseDto;
    onDelete?: (() => void) | undefined;
  }

  let { device, onDelete = undefined }: Props = $props();

  const options: ToRelativeCalendarOptions = {
    unit: 'days',
    locale: $locale,
  };
</script>

<div class="flex w-full flex-row">
  <div class="hidden items-center justify-center pe-2 text-immich-primary dark:text-immich-dark-primary sm:flex">
    {#if device.deviceOS === 'Android'}
      <Icon path={mdiAndroid} size="40" />
    {:else if device.deviceOS === 'iOS' || device.deviceOS === 'macOS'}
      <Icon path={mdiApple} size="40" />
    {:else if device.deviceOS.includes('Safari')}
      <Icon path={mdiAppleSafari} size="40" />
    {:else if device.deviceOS.includes('Windows')}
      <Icon path={mdiMicrosoftWindows} size="40" />
    {:else if device.deviceOS === 'Linux'}
      <Icon path={mdiLinux} size="40" />
    {:else if device.deviceOS === 'Ubuntu'}
      <Icon path={mdiUbuntu} size="40" />
    {:else if device.deviceOS === 'Chrome OS' || device.deviceType === 'Chrome' || device.deviceType === 'Chromium' || device.deviceType === 'Mobile Chrome'}
      <Icon path={mdiGoogleChrome} size="40" />
    {:else}
      <Icon path={mdiHelp} size="40" />
    {/if}
  </div>
  <div class="flex grow flex-row justify-between gap-1 ps-4 sm:ps-0">
    <div class="flex flex-col justify-center gap-1 dark:text-white">
      <span class="text-sm">
        {#if device.deviceType || device.deviceOS}
          <span>{device.deviceOS || $t('unknown')} • {device.deviceType || $t('unknown')}</span>
        {:else}
          <span>{$t('unknown')}</span>
        {/if}
      </span>
      <div class="text-sm">
        <span class="">{$t('last_seen')}</span>
        <span>{DateTime.fromISO(device.updatedAt, { locale: $locale }).toRelativeCalendar(options)}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400"> - </span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {DateTime.fromISO(device.updatedAt, { locale: $locale }).toLocaleString(DateTime.DATETIME_MED, {
            locale: $locale,
          })}
        </span>
      </div>
    </div>
    {#if !device.current && onDelete}
      <div>
        <CircleIconButton
          color="primary"
          icon={mdiTrashCanOutline}
          title={$t('log_out')}
          size="16"
          onclick={onDelete}
        />
      </div>
    {/if}
  </div>
</div>
