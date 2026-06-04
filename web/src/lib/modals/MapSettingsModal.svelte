<script lang="ts">
  import type { MapSettings } from '$lib/stores/preferences.store';
  import { Button, DatePicker, Field, FormModal, Select, Stack, Switch } from '@immich/ui';
  import { Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  type Props = {
    settings: MapSettings;
    onClose: (settings?: MapSettings) => void;
  };

  let { settings: initialValues, onClose }: Props = $props();
  let settings = $state(initialValues);

  let customDateRange = $state(!!settings.dateAfter || !!settings.dateBefore);

  const onSubmit = () => {
    onClose(settings);
  };
</script>

<FormModal title={$t('map_settings')} {onClose} {onSubmit} size="small">
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
        <Field label={$t('date_after')}>
          <DatePicker bind:value={settings.dateAfter} maxDate={settings.dateBefore} />
        </Field>
        <Field label={$t('date_before')}>
          <DatePicker bind:value={settings.dateBefore} />
        </Field>
        <div class="flex justify-center">
          <Button
            color="primary"
            size="small"
            variant="ghost"
            onclick={() => {
              customDateRange = false;
              settings.dateAfter = undefined;
              settings.dateBefore = undefined;
            }}
          >
            {$t('remove_custom_date_range')}
          </Button>
        </div>
      </div>
    {:else}
      <div in:fly={{ y: -10, duration: 200 }} class="flex flex-col gap-2">
        <Field label={$t('date_range')}>
          <Select
            bind:value={settings.relativeDate}
            options={[
              {
                label: $t('all'),
                value: '',
              },
              {
                label: $t('past_durations.hours', { values: { hours: 24 } }),
                value: Duration.fromObject({ hours: 24 }).toISO(),
              },
              {
                label: $t('past_durations.days', { values: { days: 7 } }),
                value: Duration.fromObject({ days: 7 }).toISO(),
              },
              {
                label: $t('past_durations.days', { values: { days: 30 } }),
                value: Duration.fromObject({ days: 30 }).toISO(),
              },
              {
                label: $t('past_durations.years', { values: { years: 1 } }),
                value: Duration.fromObject({ years: 1 }).toISO(),
              },
              {
                label: $t('past_durations.years', { values: { years: 3 } }),
                value: Duration.fromObject({ years: 3 }).toISO(),
              },
            ]}
          />
        </Field>
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
    {/if}
  </Stack>
</FormModal>
