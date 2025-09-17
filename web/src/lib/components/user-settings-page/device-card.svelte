<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { SessionResponseDto } from '@immich/sdk';
  import { Icon, IconButton } from '@immich/ui';
  import {
    mdiAndroid,
    mdiApple,
    mdiAppleSafari,
    mdiCast,
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
  <div class="hidden items-center justify-center pe-2 text-primary sm:flex">
    {#if device.deviceOS === 'Android'}
      <Icon icon={mdiAndroid} size="40" />
    {:else if device.deviceOS === 'iOS' || device.deviceOS === 'macOS'}
      <Icon icon={mdiApple} size="40" />
    {:else if device.deviceOS.includes('Safari')}
      <Icon icon={mdiAppleSafari} size="40" />
    {:else if device.deviceOS.includes('Windows')}
      <Icon icon={mdiMicrosoftWindows} size="40" />
    {:else if device.deviceOS === 'Linux'}
      <Icon icon={mdiLinux} size="40" />
    {:else if device.deviceOS === 'Ubuntu'}
      <Icon icon={mdiUbuntu} size="40" />
    {:else if device.deviceOS === 'Chrome OS' || device.deviceType === 'Chrome' || device.deviceType === 'Chromium' || device.deviceType === 'Mobile Chrome'}
      <Icon icon={mdiGoogleChrome} size="40" />
    {:else if device.deviceOS === 'Google Cast'}
      <Icon icon={mdiCast} size="40" />
    {:else}
      <Icon icon={mdiHelp} size="40" />
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
        <IconButton
          color="danger"
          variant="ghost"
          shape="round"
          icon={mdiTrashCanOutline}
          aria-label={$t('log_out')}
          size="small"
          onclick={onDelete}
        />
      </div>
    {/if}
  </div>
</div>
