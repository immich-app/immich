<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import {
    getCachedPeopleFaceStatistics,
    setCachedPeopleFaceStatistics,
  } from '$lib/components/people/people-face-statistics-info-cache';
  import { locale } from '$lib/stores/preferences.store';
  import { generateId } from '$lib/utils/generate-id';
  import { IconButton } from '@immich/ui';
  import type { PeopleFaceStatisticsResponseDto } from '@immich/sdk';
  import { mdiInformationOutline } from '@mdi/js';
  import { tick } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    cacheKey: string;
    loadStatistics: () => Promise<PeopleFaceStatisticsResponseDto>;
  }

  let { cacheKey, loadStatistics }: Props = $props();

  let isOpen = $state(false);
  let isLoading = $state(false);
  let error = $state(false);
  let statistics = $state<PeopleFaceStatisticsResponseDto | undefined>();
  let activeCacheKey = $state<string>();
  let container = $state<HTMLDivElement>();
  let panelTop = $state(0);
  let panelLeft = $state(0);

  const panelWidth = 288;
  const panelMargin = 8;
  const detailsId = `people-face-statistics-details-${generateId()}`;

  const formatNumber = (value: number) => value.toLocaleString($locale);

  const updatePanelPosition = () => {
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const viewportWidth = globalThis.innerWidth || panelWidth + panelMargin * 2;
    const maxLeft = viewportWidth - panelWidth - panelMargin;
    panelLeft = Math.max(panelMargin, Math.min(maxLeft, rect.left));
    panelTop = rect.bottom + 4;
  };

  const syncCacheKey = () => {
    if (activeCacheKey === cacheKey) {
      return;
    }

    activeCacheKey = cacheKey;
    statistics = getCachedPeopleFaceStatistics(cacheKey);
    error = false;
    isLoading = false;
  };

  $effect(() => {
    syncCacheKey();
    if (isOpen && !statistics && !isLoading && !error) {
      void loadDetails();
    }
  });

  async function loadDetails() {
    syncCacheKey();
    const requestCacheKey = cacheKey;
    const cached = getCachedPeopleFaceStatistics(requestCacheKey);
    if (cached) {
      statistics = cached;
      return;
    }

    isLoading = true;
    error = false;
    try {
      const loadedStatistics = await loadStatistics();
      setCachedPeopleFaceStatistics(requestCacheKey, loadedStatistics);
      if (cacheKey === requestCacheKey) {
        statistics = loadedStatistics;
      }
    } catch {
      if (cacheKey === requestCacheKey) {
        statistics = undefined;
        error = true;
      }
    } finally {
      if (cacheKey === requestCacheKey) {
        isLoading = false;
      }
    }
  }

  function toggleDetails() {
    isOpen = !isOpen;
    if (isOpen) {
      error = false;
      void tick().then(updatePanelPosition);
    }
  }

  const closeDetails = () => {
    isOpen = false;
  };
</script>

<svelte:window onresize={updatePanelPosition} onscroll={updatePanelPosition} />

<div
  bind:this={container}
  class="relative inline-flex"
  data-testid="people-face-statistics-info"
  use:clickOutside={{ onOutclick: closeDetails, onEscape: closeDetails }}
>
  <IconButton
    aria-controls={detailsId}
    aria-expanded={isOpen}
    aria-label={$t('view_face_statistics_details')}
    color="secondary"
    icon={mdiInformationOutline}
    onclick={() => void toggleDetails()}
    shape="round"
    size="small"
    title={$t('view_face_statistics_details')}
    variant="ghost"
  />

  {#if isOpen}
    <div
      aria-label={$t('view_face_statistics_details')}
      class="fixed z-50 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg dark:border-gray-700 dark:bg-immich-dark-gray"
      data-testid="people-face-statistics-details"
      id={detailsId}
      role="dialog"
      style:left="{panelLeft}px"
      style:top="{panelTop}px"
    >
      {#if isLoading}
        <p class="text-gray-500 dark:text-gray-300" role="status">{$t('loading_face_statistics')}</p>
      {:else if error}
        <p class="text-red-600 dark:text-red-400" role="alert">{$t('unable_to_load_face_statistics')}</p>
      {:else if statistics}
        <dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
          <dt class="text-gray-500 dark:text-gray-300">{$t('detected_faces')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.detectedFaceCount)}</dd>
          <dt class="text-gray-500 dark:text-gray-300">{$t('assigned_to_visible_people')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.assignedVisibleFaceCount)}</dd>
          <dt class="text-gray-500 dark:text-gray-300">{$t('named_visible_people')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.namedVisiblePersonCount)}</dd>
          <dt class="text-gray-500 dark:text-gray-300">{$t('assigned_to_hidden_people')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.assignedHiddenFaceCount)}</dd>
          <dt class="text-gray-500 dark:text-gray-300">{$t('unassigned')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.unassignedFaceCount)}</dd>
        </dl>
      {/if}
    </div>
  {/if}
</div>
