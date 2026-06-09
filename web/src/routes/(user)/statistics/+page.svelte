<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/EmptyPlaceholder.svelte';
  import CameraLensSection from '$lib/components/statistics/CameraLensSection.svelte';
  import LocationSection from '$lib/components/statistics/LocationSection.svelte';
  import MonthlySection from '$lib/components/statistics/MonthlySection.svelte';
  import PeopleSection from '$lib/components/statistics/PeopleSection.svelte';
  import StatCard from '$lib/components/statistics/StatCard.svelte';
  import StorageBreakdown from '$lib/components/statistics/StorageBreakdown.svelte';
  import TemporalSection from '$lib/components/statistics/TemporalSection.svelte';
  import { Route } from '$lib/route';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import {
    formatBytes,
    formatHour,
    getHourLabels,
    getSortedMonthly,
    getStorageSegments,
    getStorageTotal,
    getTemporalCounts,
    getTemporalPersona,
    getTemporalRows,
    getTemporalStats,
    getWeekdayLabels,
    hasStatisticsData,
    type PersonaInfo,
  } from '$lib/utils/statistics';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const statistics = $derived(data.statistics);
  const pageTitle = $derived(data.meta.title);

  // Sorted and formatted data
  const monthly = $derived(getSortedMonthly(statistics));
  const weekdayLabels = $derived(getWeekdayLabels());
  const weekdayLongLabels = $derived(getWeekdayLabels('long'));
  const hourLabels = $derived(getHourLabels());

  // Temporal matrix calculations
  const temporalCounts = $derived(getTemporalCounts(statistics));
  const { temporalTotal, temporalMax, peakHour, peakDay, weekendShare } = $derived(getTemporalStats(temporalCounts));
  const temporalPersonaData = $derived(getTemporalPersona(temporalTotal, peakHour, peakDay, weekendShare));
  const temporalPersona = $derived.by((): PersonaInfo | null => {
    if (!temporalPersonaData) {
      return null;
    }

    const peakDayLabel = weekdayLongLabels[temporalPersonaData.peakDay] ?? $t('statistics_unknown_day');
    const translationKey = `statistics_temporal_persona_${temporalPersonaData.kind}`;

    return {
      title: $t(`${translationKey}_title` as unknown as Parameters<typeof $t>[0]),
      description: $t(`${translationKey}_description` as unknown as Parameters<typeof $t>[0], {
        values: {
          peakHour: formatHour(temporalPersonaData.peakHour),
          peakDayLabel,
        },
      }),
    };
  });
  const temporalRows = $derived(getTemporalRows(weekdayLabels, hourLabels, temporalCounts, temporalMax));

  // Monthly and people data
  const maxMonthlyCount = $derived(Math.max(...monthly.map((item) => item.count), 1));
  const topPeopleTotal = $derived(statistics.topPeople.reduce((sum, person) => sum + person.count, 0));

  // Storage calculations
  const storageTotal = $derived(getStorageTotal(statistics));
  const storageSegments = $derived(getStorageSegments(statistics));

  // Search URL builders
  const getTemporalSearchUrl = (dayOfWeek?: number, hour?: number) => Route.search({ dayOfWeek, hour });

  const getMonthSearchUrl = (year: number, month: number) => {
    const takenAfter = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)).toISOString();
    const takenBefore = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();
    return Route.search({ takenAfter, takenBefore });
  };

  const getCameraModelSearchUrl = (make: string | null, model: string | null) =>
    Route.search({ make: make ?? undefined, model: model ?? undefined });

  const getLensSearchUrl = (lensModel: string | null) => Route.search({ lensModel: lensModel ?? undefined });

  const getCitySearchUrl = (city: string | null) => Route.search({ city: city ?? undefined });

  const getCountrySearchUrl = (country: string | null) => Route.search({ country: country ?? undefined });

  const hasData = $derived(hasStatisticsData(statistics, monthly));
</script>

<UserPageLayout title={pageTitle}>
  <div class="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
    {#if hasData}
      <!-- Summary Stats -->
      <section class="grid gap-4 md:grid-cols-3">
        <StatCard title={$t('photos')} value={statistics.total.photos.toLocaleString()} subtitle={undefined} />
        <StatCard title={$t('videos')} value={statistics.total.videos.toLocaleString()} subtitle={undefined} />
        <StatCard title={$t('storage')} value={formatBytes(statistics.total.storage)} subtitle={undefined} />
      </section>

      <!-- Location Section -->
      <LocationSection
        cities={statistics.topCities}
        countries={statistics.topCountries}
        {getCitySearchUrl}
        {getCountrySearchUrl}
      />

      <!-- Monthly Section -->
      <MonthlySection {monthly} maxCount={maxMonthlyCount} getSearchUrl={getMonthSearchUrl} />

      <!-- Temporal Matrix Section -->
      <TemporalSection
        {temporalTotal}
        {temporalRows}
        {hourLabels}
        {temporalPersona}
        getSearchUrl={getTemporalSearchUrl}
      />

      <!-- People Section -->
      <PeopleSection topPeople={statistics.topPeople} {topPeopleTotal} />

      <!-- Camera & Lens Section -->
      <CameraLensSection
        cameras={statistics.topCameras}
        lenses={statistics.topLenses}
        getCameraSearchUrl={getCameraModelSearchUrl}
        {getLensSearchUrl}
      />

      <!-- Storage Breakdown Section -->
      <StorageBreakdown {statistics} {storageSegments} {storageTotal} />
    {:else}
      <EmptyPlaceholder
        title={$t('nothing_here_yet')}
        text={$t('statistics_available_after_upload')}
        class="mx-auto mb-12"
        onClick={() => openFileUploadDialog()}
      />
    {/if}
  </div>
</UserPageLayout>
