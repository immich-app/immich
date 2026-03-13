<script lang="ts">
  import { getAssetMediaUrl } from '$lib/utils';
  import { AssetMediaSize, type SharedSpaceResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import {
    mdiAccountGroupOutline,
    mdiAccountMultipleOutline,
    mdiCameraOutline,
    mdiCursorMove,
    mdiImageEditOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    space: SharedSpaceResponseDto;
    memberCount: number;
    assetCount: number;
    currentRole?: string;
    gradientClass?: string;
    onSetCover?: () => void;
    onReposition?: () => void;
    repositioning?: boolean;
    onSavePosition?: (cropY: number) => void;
    onCancelReposition?: () => void;
    peopleCount?: number;
    faceRecognitionEnabled?: boolean;
    spaceId?: string;
    height?: number;
  }

  let {
    space,
    memberCount,
    assetCount,
    currentRole,
    gradientClass = 'from-gray-400 to-gray-600',
    onSetCover,
    onReposition,
    repositioning = false,
    onSavePosition,
    onCancelReposition,
    peopleCount,
    faceRecognitionEnabled,
    spaceId,
    height = 450,
  }: Props = $props();

  let coverUrl = $derived(
    space.thumbnailAssetId ? getAssetMediaUrl({ id: space.thumbnailAssetId, size: AssetMediaSize.Preview }) : null,
  );
  let showFullDescription = $state(false);

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    editor: 'Editor',
    viewer: 'Viewer',
  };

  // Drag-to-reposition state
  let dragCropY = $state(50);
  let isDragging = $state(false);
  let dragStartY = $state(0);
  let dragStartCropY = $state(50);
  let hasInteracted = $state(false);

  $effect(() => {
    if (repositioning) {
      dragCropY = space.thumbnailCropY ?? 50;
      hasInteracted = false;
    }
  });

  let displayCropY = $derived(repositioning ? dragCropY : (space.thumbnailCropY ?? 50));

  let hasCover = $derived(!!space.thumbnailAssetId);

  const handlePointerDown = (e: PointerEvent) => {
    if (!repositioning) {
      return;
    }
    isDragging = true;
    dragStartY = e.clientY;
    dragStartCropY = dragCropY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) {
      return;
    }
    hasInteracted = true;
    const deltaY = e.clientY - dragStartY;
    const deltaPct = -(deltaY / 2.5);
    dragCropY = Math.round(Math.min(100, Math.max(0, dragStartCropY + deltaPct)));
  };

  const handlePointerUp = () => {
    isDragging = false;
  };
</script>

<div class="relative w-full overflow-hidden rounded-xl" style="height: {height}px;" data-testid="space-hero">
  {#if coverUrl}
    <img
      src={coverUrl}
      alt={space.name}
      class="absolute inset-0 size-full select-none object-cover"
      class:cursor-grab={repositioning && !isDragging}
      class:cursor-grabbing={repositioning && isDragging}
      style="object-position: center {displayCropY}%;"
      draggable="false"
      data-testid="hero-cover-image"
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
    />
  {:else}
    <div class="absolute inset-0 bg-gradient-to-br {gradientClass}" data-testid="hero-gradient"></div>
  {/if}

  {#if repositioning}
    <!-- Reposition mode overlay -->
    <div class="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent"></div>
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent"
    ></div>

    {#if !hasInteracted}
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center" data-testid="reposition-hint">
        <span class="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
          {$t('drag_to_reposition')}
        </span>
      </div>
    {/if}

    <div class="absolute bottom-3 right-3 flex gap-2" data-testid="reposition-controls">
      <button
        type="button"
        class="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        onclick={onCancelReposition}
        data-testid="reposition-cancel-button"
      >
        {$t('cancel')}
      </button>
      <button
        type="button"
        class="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
        onclick={() => onSavePosition?.(dragCropY)}
        data-testid="reposition-save-button"
      >
        {$t('save')}
      </button>
    </div>
  {:else}
    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

    {#if !hasCover && onSetCover}
      <button
        type="button"
        class="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        onclick={onSetCover}
        data-testid="hero-set-cover-button"
      >
        <Icon icon={mdiImageEditOutline} size="14" />
        {$t('set_cover_photo')}
      </button>
    {:else if hasCover && onSetCover && onReposition}
      <div class="absolute right-3 top-3 flex gap-2" data-testid="hero-cover-buttons">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          onclick={onReposition}
          data-testid="hero-reposition-button"
        >
          <Icon icon={mdiCursorMove} size="14" />
          {$t('reposition')}
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          onclick={onSetCover}
          data-testid="hero-change-cover-button"
        >
          <Icon icon={mdiImageEditOutline} size="14" />
          {$t('change_cover_photo')}
        </button>
      </div>
    {/if}

    <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
      <h1 class="text-2xl font-bold drop-shadow-md" data-testid="hero-title">{space.name}</h1>

      {#if space.description}
        <p
          class="mt-1 text-sm text-white/80 drop-shadow-sm"
          class:line-clamp-2={!showFullDescription}
          data-testid="hero-description"
        >
          {space.description}
        </p>
        {#if space.description.length > 120}
          <button
            type="button"
            class="mt-0.5 text-xs text-white/60 hover:text-white/90"
            onclick={() => (showFullDescription = !showFullDescription)}
            data-testid="hero-show-more"
          >
            {showFullDescription ? $t('show_less') : $t('show_more')}
          </button>
        {/if}
      {/if}

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm"
          data-testid="hero-photo-count"
        >
          <Icon icon={mdiCameraOutline} size="16" />
          {assetCount}
          {$t('photos')}
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm"
          data-testid="hero-member-count"
        >
          <Icon icon={mdiAccountMultipleOutline} size="16" />
          {memberCount}
          {$t('members')}
        </span>
        {#if faceRecognitionEnabled && peopleCount && peopleCount > 0}
          <a
            href="/spaces/{spaceId}/people"
            class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm hover:bg-white/30 transition-colors"
            data-testid="hero-people-count"
          >
            <Icon icon={mdiAccountGroupOutline} size="16" />
            {peopleCount}
            {$t('people')}
          </a>
        {/if}
        {#if currentRole}
          <span
            class="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium capitalize backdrop-blur-sm"
            data-testid="hero-role-badge"
          >
            {roleLabels[currentRole] ?? currentRole}
          </span>
        {/if}
      </div>
    </div>
  {/if}
</div>
