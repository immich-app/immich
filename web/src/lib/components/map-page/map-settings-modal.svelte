<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import type { MapSettings } from '$lib/stores/preferences.store';
  import { Button, Field, Stack, Switch } from '@immich/ui';
  import { Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';
  import DateInput from '../elements/date-input.svelte';

  interface Props {
    settings: MapSettings;
    onClose: () => void;
    onSave: (settings: MapSettings) => void;
  }

  let { settings: initialValues, onClose, onSave }: Props = $props();
  let settings = $state(initialValues);

  let customDateRange = $state(!!settings.dateAfter || !!settings.dateBefore);

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSave(settings);
  };
</script>

<form {onsubmit}>
  <FullScreenModal title={$t('map_settings')} {onClose}>
    <Stack gap={4}>
      <Field label={$t('allow_dark_mode')}>
        <Switch bind:checked={settings.allowDarkMode} />
      </Field>
      <Field label={$t('only_favorites')}>
        <Switch bind:checked={settings.onlyFavorites} />
      </Field>
      <Field label={$t('include_archived')}>
        <Switch bind:checked={settings.includeArchived} />
      </Field>
      <Field label={$t('include_shared_partner_assets')}>
        <Switch bind:checked={settings.withPartners} />
      </Field>
      <Field label={$t('include_shared_albums')}>
        <Switch bind:checked={settings.withSharedAlbums} />
      </Field>

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
            <Button
              color="primary"
              size="small"
              variant="ghost"
              onclick={() => {
                customDateRange = false;
                settings.dateAfter = '';
                settings.dateBefore = '';
              }}
            >
              {$t('remove_custom_date_range')}
            </Button>
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
            <Button
              color="primary"
              size="small"
              variant="ghost"
              onclick={() => {
                customDateRange = true;
                settings.relativeDate = '';
              }}
            >
              {$t('use_custom_date_range')}
            </Button>
          </div>
        </div>
      {/if}
    </Stack>

    {#snippet stickyBottom()}
      <Button color="secondary" shape="round" fullWidth onclick={onClose}>{$t('cancel')}</Button>
      <Button type="submit" shape="round" fullWidth>{$t('save')}</Button>
    {/snippet}
  </FullScreenModal>
</form>
