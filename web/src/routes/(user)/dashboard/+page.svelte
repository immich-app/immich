<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import type { PageData } from './$types';
  import { getAssetMediaUrl } from '$lib/utils';
  import {
    mdiRefresh,
    mdiTag,
    mdiImageOffOutline,
    mdiAccountGroup,
    mdiImageMultiple,
    mdiClockOutline,
    mdiCog,
    mdiChartArc,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { Route } from '$lib/route';
  import { searchAssets, getAssetInfo, type AssetResponseDto, type TagResponseDto } from '@immich/sdk';
  import { Icon, Select } from '@immich/ui';
  import Portal from '$lib/elements/Portal.svelte';
  import { dashboardMemoryTag } from '$lib/stores/preferences.store';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();

  let userName = $derived(authManager.user.name);
  let tags = $derived(data.tags);

  let tagOptions = $derived([
    { label: $t('dashboard_page.select_tag'), value: '' },
    ...tags.map((tag: TagResponseDto) => ({
      label: tag.name,
      value: tag.id,
    })),
  ]);

  // Greetings Message
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return $t('dashboard_page.good_morning', { values: { name: userName } });
    }
    if (hour >= 12 && hour < 19) {
      return $t('dashboard_page.good_afternoon', { values: { name: userName } });
    }
    return $t('dashboard_page.good_evening', { values: { name: userName } });
  };
  let greeting = $derived(getGreeting());

  const getMessageOfTheDay = () => {
    const messages = $t('dashboard_page.messages') as unknown as string[];
    if (!messages || messages.length === 0) {
      return '';
    }
    const dayOfMonth = new Date().getDate();
    return messages[dayOfMonth % messages.length];
  };
  let messageOfTheDay = $derived(getMessageOfTheDay());

  // Tag Spotlight
  let memoryAsset = $state<AssetResponseDto | null>(null);
  let isMemoryLoading = $state(false);

  $effect(() => {
    if ($dashboardMemoryTag) {
      void fetchRandomMemory($dashboardMemoryTag);
    } else {
      memoryAsset = null;
    }
  });

  const fetchRandomMemory = async (tagId: string) => {
    if (!tagId) {
      return;
    }

    isMemoryLoading = true;
    try {
      const response = await searchAssets({
        metadataSearchDto: { tagIds: [tagId], page: 1, size: 100 },
      });
      const items = response.assets.items;
      memoryAsset = items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null;
    } finally {
      isMemoryLoading = false;
    }
  };

  const onViewAsset = async (id: string) => {
    const asset = await getAssetInfo({ ...authManager.params, id });
    assetViewerManager.setAsset(asset);
  };

  let assetCursor = $derived({
    current: assetViewerManager.asset!,
  });

  // Statistics
  let stats = $derived(data.stats);

  let totalPhotos = $derived(stats.timeline.images + stats.archive.images);
  let totalVideos = $derived(stats.timeline.videos + stats.archive.videos);
  let totalMedia = $derived(totalPhotos + totalVideos || 1);
  let photosPercentage = $derived((totalPhotos / totalMedia) * 100);
  let videosPercentage = $derived((totalVideos / totalMedia) * 100);
</script>

<UserPageLayout title={data.meta.title}>
  <div class="mx-auto max-w-7xl px-4 py-8">
    <div class="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
      <div class="flex flex-col gap-8">
        <!-- Greetings -->
        <section
          class="flex flex-1 flex-col justify-center rounded-3xl border border-immich-bg bg-white p-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray/50"
        >
          <h1 class="mb-4 text-4xl font-bold text-immich-primary dark:text-immich-dark-primary">
            {greeting}
          </h1>
          <p class="text-lg font-medium text-immich-fg dark:text-immich-dark-fg">
            {messageOfTheDay}
          </p>
        </section>

        <!-- Quick Actions -->
        <section
          class="flex flex-1 flex-col justify-center rounded-3xl border border-immich-bg bg-white p-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray/50"
        >
          <h2 class="mb-4 text-xl font-semibold text-immich-primary dark:text-immich-dark-primary">
            {$t('dashboard_page.quick_actions')}
          </h2>
          <div class="grid grid-cols-4 gap-4">
            <a
              href={Route.recentlyAdded()}
              class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/5 bg-immich-bg p-4 text-center transition-colors hover:bg-immich-primary/10 dark:border-white/5 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <Icon icon={mdiClockOutline} size="24" class="text-immich-primary dark:text-immich-dark-primary" />
              <span class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
                {$t('dashboard_page.new')}
              </span>
            </a>
            <a
              href={Route.people()}
              class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/5 bg-immich-bg p-4 text-center transition-colors hover:bg-immich-primary/10 dark:border-white/5 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <Icon icon={mdiAccountGroup} size="24" class="text-immich-primary dark:text-immich-dark-primary" />
              <span class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
                {$t('dashboard_page.view_people')}
              </span>
            </a>
            <a
              href={Route.duplicatesUtility()}
              class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/5 bg-immich-bg p-4 text-center transition-colors hover:bg-immich-primary/10 dark:border-white/5 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <Icon icon={mdiImageMultiple} size="24" class="text-immich-primary dark:text-immich-dark-primary" />
              <span class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg"
                >{$t('dashboard_page.duplicates')}
              </span>
            </a>
            <a
              href={Route.userSettings()}
              class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/5 bg-immich-bg p-4 text-center transition-colors hover:bg-immich-primary/10 dark:border-white/5 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <Icon icon={mdiCog} size="24" class="text-immich-primary dark:text-immich-dark-primary" />
              <span class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
                {$t('dashboard_page.settings')}
              </span>
            </a>
          </div>
        </section>
      </div>

      <!-- Tag Spotlight -->
      <section
        class="flex h-full flex-col rounded-3xl border border-immich-bg bg-white p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray/50"
      >
        <div class="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h2 class="text-xl font-semibold text-immich-primary dark:text-immich-dark-primary">
            {$t('dashboard_page.tag_spotlight')}
          </h2>

          <div class="flex items-center gap-2 self-start xl:self-auto">
            <Icon icon={mdiTag} size="24" class="text-immich-primary dark:text-immich-dark-primary" />

            <div class="w-48">
              <Select options={tagOptions} bind:value={$dashboardMemoryTag} />
            </div>

            <button
              type="button"
              onclick={() => void fetchRandomMemory($dashboardMemoryTag)}
              disabled={!$dashboardMemoryTag || isMemoryLoading}
              class="p-1.5 text-immich-fg/60 transition-colors hover:text-immich-primary disabled:opacity-50"
              title={$t('dashboard_page.refresh_memory')}
            >
              <Icon icon={mdiRefresh} size="20" class={isMemoryLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div
          class="relative flex min-h-[250px] w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-immich-bg dark:bg-immich-dark-bg"
        >
          {#if isMemoryLoading}
            <div class="size-8 w-8 animate-spin rounded-full border-4 border-immich-primary border-t-transparent"></div>
          {:else if memoryAsset}
            {@const imageUrl = getAssetMediaUrl({ id: memoryAsset.id })}
            <button
              type="button"
              class="absolute inset-0 block size-full cursor-pointer"
              onclick={() => void onViewAsset(memoryAsset!.id)}
            >
              <!-- Blurred background fill effect -->
              <img src={imageUrl} alt="" class="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-xl" />
              <img
                src={imageUrl}
                alt={$t('dashboard_page.tag_spotlight')}
                class="relative size-full object-contain drop-shadow-lg transition-transform duration-700 hover:scale-105"
              />
            </button>
          {:else if $dashboardMemoryTag}
            <div class="p-4 text-center text-immich-fg/60 dark:text-immich-dark-fg/60">
              <Icon icon={mdiImageOffOutline} size="48" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">{$t('dashboard_page.no_photos_for_tag')}</p>
            </div>
          {:else}
            <div class="p-4 text-center text-immich-fg/60 dark:text-immich-dark-fg/60">
              <Icon icon={mdiTag} size="48" class="mx-auto mb-2 opacity-50" />
              <p class="text-sm">{$t('dashboard_page.select_tag_prompt')}</p>
            </div>
          {/if}
        </div>
      </section>
    </div>

    <!-- Statistics -->
    <div class="mt-12">
      <div class="mb-6 flex items-center gap-2">
        <Icon icon={mdiChartArc} size="28" class="text-immich-primary dark:text-immich-dark-primary" />
        <h2 class="text-2xl font-bold text-immich-primary dark:text-immich-dark-primary">
          {$t('dashboard_page.statistics')}
        </h2>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Media Breakdown Card -->
        <a
          href={Route.photos()}
          class="flex min-h-[150px] flex-col rounded-3xl border border-immich-bg bg-white p-6 shadow-sm transition-colors hover:bg-immich-primary/5 dark:border-immich-dark-gray dark:bg-immich-dark-gray/50 dark:hover:bg-white/5"
        >
          <h3 class="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
            {$t('dashboard_page.media_breakdown')}
          </h3>

          <div class="mt-auto pt-4">
            <div class="mb-4 flex items-end justify-between">
              <div>
                <span class="block text-3xl font-bold text-immich-primary dark:text-immich-dark-primary">
                  {totalPhotos + totalVideos}
                </span>
                <span class="text-sm font-medium text-immich-fg/70 dark:text-immich-dark-fg/70">
                  {$t('dashboard_page.total_items')}
                </span>
              </div>
            </div>
            <!-- Graph -->
            <div class="mb-3 flex h-4 w-full overflow-hidden rounded-full bg-immich-bg dark:bg-immich-dark-bg">
              <div
                class="h-full bg-immich-primary transition-all duration-1000 dark:bg-immich-dark-primary"
                style="width: {photosPercentage}%;"
                title={$t('dashboard_page.photos')}
              ></div>
              <div
                class="h-full bg-amber-500 transition-all duration-1000 dark:bg-amber-400"
                style="width: {videosPercentage}%;"
                title={$t('dashboard_page.videos')}
              ></div>
            </div>
            <!-- Graph Caption -->
            <div class="flex justify-between text-sm">
              <div class="flex items-center gap-2">
                <div class="size-3 rounded-full bg-immich-primary dark:bg-immich-dark-primary"></div>
                <span class="text-immich-fg dark:text-immich-dark-fg">{totalPhotos} {$t('dashboard_page.photos')}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="size-3 rounded-full bg-amber-500 dark:bg-amber-400"></div>
                <span class="text-immich-fg dark:text-immich-dark-fg"
                  >{totalVideos} {$t('dashboard_page.videos')}
                </span>
              </div>
            </div>
          </div>
        </a>

        <!-- Library Location Card -->
        <section
          class="flex min-h-[150px] flex-col rounded-3xl border border-immich-bg bg-white p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray/50"
        >
          <h3 class="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
            {$t('dashboard_page.library_locations')}
          </h3>

          <div class="mt-auto flex flex-col pt-1">
            <a
              href={Route.photos()}
              class="flex items-center justify-between rounded-xl bg-immich-bg p-3 transition-colors hover:bg-immich-primary/10 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <span class="font-medium text-immich-fg dark:text-immich-dark-fg">{$t('dashboard_page.timeline')}</span>
              <span class="font-bold text-immich-primary dark:text-immich-dark-primary">{stats.timeline.total}</span>
            </a>

            <a
              href={Route.favorites()}
              class="flex items-center justify-between rounded-xl bg-immich-bg p-3 transition-colors hover:bg-immich-primary/10 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <span class="font-medium text-immich-fg dark:text-immich-dark-fg">{$t('dashboard_page.favorites')}</span>
              <span class="font-bold text-immich-primary dark:text-immich-dark-primary">{stats.favorites.total}</span>
            </a>

            <a
              href={Route.archive()}
              class="flex items-center justify-between rounded-xl bg-immich-bg p-3 transition-colors hover:bg-immich-primary/10 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <span class="font-medium text-immich-fg dark:text-immich-dark-fg">{$t('dashboard_page.archive')}</span>
              <span class="font-bold text-immich-primary dark:text-immich-dark-primary">{stats.archive.total}</span>
            </a>

            <a
              href={Route.trash()}
              class="flex items-center justify-between rounded-xl bg-immich-bg p-3 transition-colors hover:bg-immich-primary/10 dark:bg-immich-dark-bg dark:hover:bg-white/5"
            >
              <span class="font-medium text-immich-fg dark:text-immich-dark-fg">{$t('dashboard_page.trash')}</span>
              <span class="font-bold text-immich-primary dark:text-immich-dark-primary">{stats.trash.total}</span>
            </a>
          </div>
        </section>

        <!-- Albums Overview Card -->
        <section
          class="flex min-h-[150px] flex-col rounded-3xl border border-immich-bg bg-white p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray/50"
        >
          <h3 class="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
            {$t('dashboard_page.albums_overview')}
          </h3>

          <div class="mt-auto flex flex-col gap-4 pt-4">
            <a
              href={Route.albums()}
              class="flex items-center gap-4 rounded-2xl border border-immich-bg bg-immich-bg/50 p-4 transition-colors hover:bg-immich-primary/5 dark:border-immich-dark-gray dark:bg-immich-dark-bg/30 dark:hover:bg-white/5"
            >
              <div
                class="rounded-full bg-immich-primary/10 p-3 text-immich-primary dark:bg-immich-dark-primary/10 dark:text-immich-dark-primary"
              >
                <Icon icon={mdiTag} size="24" />
              </div>
              <div>
                <span class="block text-2xl font-bold text-immich-fg dark:text-immich-dark-fg">
                  {stats.albums.owned}
                </span>
                <span class="text-sm font-medium text-immich-fg/70 dark:text-immich-dark-fg/70">
                  {$t('dashboard_page.owned_albums')}
                </span>
              </div>
            </a>

            <a
              href={Route.sharing()}
              class="flex items-center gap-4 rounded-2xl border border-immich-bg bg-immich-bg/50 p-4 transition-colors hover:bg-immich-primary/5 dark:border-immich-dark-gray dark:bg-immich-dark-bg/30 dark:hover:bg-white/5"
            >
              <div
                class="rounded-full bg-immich-primary/10 p-3 text-immich-primary dark:bg-immich-dark-primary/10 dark:text-immich-dark-primary"
              >
                <Icon icon={mdiAccountGroup} size="24" />
              </div>
              <div>
                <span class="block text-2xl font-bold text-immich-fg dark:text-immich-dark-fg">
                  {stats.albums.shared}
                </span>
                <span class="text-sm font-medium text-immich-fg/70 dark:text-immich-dark-fg/70">
                  {$t('dashboard_page.shared_albums')}
                </span>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  </div>
</UserPageLayout>

<!-- Overlay Asset Viewer -->
{#if assetViewerManager.isViewing}
  <Portal target="body">
    {#await import('$lib/components/asset-viewer/AssetViewer.svelte') then { default: AssetViewer }}
      <AssetViewer
        cursor={assetCursor}
        showNavigation={false}
        onClose={() => assetViewerManager.showAssetViewer(false)}
      />
    {/await}
  </Portal>
{/if}
