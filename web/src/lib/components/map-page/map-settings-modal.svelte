<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import SettingSwitch from '$lib/components/shared-components/settings/setting-switch.svelte';
  import type { MapSettings } from '$lib/stores/preferences.store';
  import { Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import Button from '../elements/buttons/button.svelte';
  import LinkButton from '../elements/buttons/link-button.svelte';
  import DateInput from '../elements/date-input.svelte';

  interface Props {
    settings: MapSettings;
    onClose: () => void;
    onSave: (settings: MapSettings) => void;
  }

  let { settings = $bindable(), onClose, onSave }: Props = $props();

  let customDateRange = $state(!!settings.dateAfter || !!settings.dateBefore);

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSave(settings);
  };
</script>

<FullScreenModal title={$t('map_settings')} {onClose}>
  <form {onsubmit} class="flex flex-col gap-4 text-immich-primary dark:text-immich-dark-primary" id="map-settings-form">
    <SettingSwitch title={$t('allow_dark_mode')} bind:checked={settings.allowDarkMode} />
    <SettingSwitch title={$t('only_favorites')} bind:checked={settings.onlyFavorites} />
    <SettingSwitch title={$t('include_archived')} bind:checked={settings.includeArchived} />
    <SettingSwitch title={$t('include_shared_partner_assets')} bind:checked={settings.withPartners} />
    <SettingSwitch title={$t('include_shared_albums')} bind:checked={settings.withSharedAlbums} />
    {#if customDateRange}
      <div in:fly={{ y: 10, duration: 200 }} class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-8">
          <label class="immich-form-label shrink-0 text-sm" for="date-after">{$t('date_after')}</label>
          <DateInput
            class="immich-form-input w-40"
            type="date"
            id="date-after"
            max={settings.dateBefore}
            bind:value={settings.dateAfter}
          />
        </div>
        <div class="flex items-center justify-between gap-8">
          <label class="immich-form-label shrink-0 text-sm" for="date-before">{$t('date_before')}</label>
          <DateInput class="immich-form-input w-40" type="date" id="date-before" bind:value={settings.dateBefore} />
        </div>
        <div class="flex justify-center text-xs">
          <LinkButton
            onclick={() => {
              customDateRange = false;
              settings.dateAfter = '';
              settings.dateBefore = '';
            }}
          >
            {$t('remove_custom_date_range')}
          </LinkButton>
        </div>
      </div>
    {:else}
      <div in:fly={{ y: -10, duration: 200 }} class="flex flex-col gap-1">
        <SettingSelect
          label={$t('date_range')}
          name="date-range"
          bind:value={settings.relativeDate}
          options={[
            {
              value: '',
              text: $t('all'),
            },
            {
              value: Duration.fromObject({ hours: 24 }).toISO() || '',
              text: $t('past_durations.hours', { values: { hours: 24 } }),
            },
            {
              value: Duration.fromObject({ days: 7 }).toISO() || '',
              text: $t('past_durations.days', { values: { days: 7 } }),
            },
            {
              value: Duration.fromObject({ days: 30 }).toISO() || '',
              text: $t('past_durations.days', { values: { days: 30 } }),
            },
            {
              value: Duration.fromObject({ years: 1 }).toISO() || '',
              text: $t('past_durations.years', { values: { years: 1 } }),
            },
            {
              value: Duration.fromObject({ years: 3 }).toISO() || '',
              text: $t('past_durations.years', { values: { years: 3 } }),
            },
          ]}
        />
        <div class="text-xs">
          <LinkButton
            onclick={() => {
              customDateRange = true;
              settings.relativeDate = '';
            }}
          >
            {$t('use_custom_date_range')}
          </LinkButton>
        </div>
      </div>
    {/if}
  </form>

  {#snippet stickyBottom()}
    <Button color="gray" size="sm" fullwidth onclick={onClose}>{$t('cancel')}</Button>
    <Button type="submit" size="sm" fullwidth form="map-settings-form">{$t('save')}</Button>
  {/snippet}
</FullScreenModal>
