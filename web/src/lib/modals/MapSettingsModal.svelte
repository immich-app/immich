<script lang="ts">
  import { mapSettings, mapShowHeatmap, type MapSettings } from '$lib/stores/preferences.store';
  import { Button, DatePicker, Field, FormModal, Select, Stack, Switch } from '@immich/ui';
  import { DateTime, Duration } from 'luxon';
  import { t } from 'svelte-i18n';
  import { fly } from 'svelte/transition';

  type Props = {
    onClose: (settings?: MapSettings) => void;
  };

  let { onClose }: Props = $props();
  let settings = $state({ ...$mapSettings });
  let showHeatmap = $state($mapShowHeatmap);

  let customDateRange = $state(!!settings.dateAfter || !!settings.dateBefore);

  const onSubmit = () => {
    $mapShowHeatmap = showHeatmap;
    onClose(settings);
  };
</script>

<FormModal title={$t('map_settings')} {onClose} {onSubmit} size="small">
  <Stack gap={4}>
    <Field label={$t('map_settings_only_show_favorites')}>
      <Switch bind:checked={settings.onlyFavorites} />
    </Field>
    <Field label={$t('map_settings_include_show_archived')}>
      <Switch bind:checked={settings.includeArchived} />
    </Field>
    <Field label={$t('map_settings_include_show_partners')}>
      <Switch bind:checked={settings.withPartners} />
    </Field>
    <Field label={$t('include_shared_albums')}>
      <Switch bind:checked={settings.withSharedAlbums} />
    </Field>
    <Field label="Show Heatmap">
      <Switch bind:checked={showHeatmap} />
    </Field>

    {#if customDateRange}
      <div in:fly={{ y: 10, duration: 200 }} class="flex flex-col gap-4">
        <Field label={$t('date_after')}>
          <DatePicker
            value={DateTime.fromISO(settings.dateAfter ?? '')}
            maxDate={DateTime.fromISO(settings.dateBefore ?? '')}
            onChange={(date) => (settings.dateAfter = date?.toUTC().toISO() ?? undefined)}
          />
        </Field>
        <Field label={$t('date_before')}>
          <DatePicker
            value={DateTime.fromISO(settings.dateBefore ?? '')}
            onChange={(date) => (settings.dateBefore = date?.toUTC().toISO() ?? undefined)}
          />
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
