<script lang="ts">
  import { intersectionObserver } from '$lib/actions/intersection-observer';
  import Icon from '$lib/components/elements/icon.svelte';
  import { ProjectionType } from '$lib/constants';
  import { getAssetThumbnailUrl, isSharedLink } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { timeToSeconds } from '$lib/utils/date-time';
  import { AssetMediaSize, AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
  import { locale, playVideoThumbnailOnHover } from '$lib/stores/preferences.store';
  import { getAssetPlaybackUrl } from '$lib/utils';
  import {
    mdiArchiveArrowDownOutline,
    mdiCameraBurst,
    mdiCheckCircle,
    mdiHeart,
    mdiMotionPauseOutline,
    mdiMotionPlayOutline,
    mdiRotate360,
  } from '@mdi/js';

  import { fade } from 'svelte/transition';
  import ImageThumbnail from './image-thumbnail.svelte';
  import VideoThumbnail from './video-thumbnail.svelte';
  import { currentUrlReplaceAssetId } from '$lib/utils/navigation';
  import { AssetStore } from '$lib/stores/assets.store';

  import type { DateGroup } from '$lib/utils/timeline-util';

  import { generateId } from '$lib/utils/generate-id';
  import { onDestroy } from 'svelte';
  import { TUNABLES } from '$lib/utils/tunables';
  import { thumbhash } from '$lib/actions/thumbhash';

  export let asset: AssetResponseDto;
  export let dateGroup: DateGroup | undefined = undefined;
  export let assetStore: AssetStore | undefined = undefined;
  export let groupIndex = 0;
  export let thumbnailSize: number | undefined = undefined;
  export let thumbnailWidth: number | undefined = undefined;
  export let thumbnailHeight: number | undefined = undefined;
  export let selected = false;
  export let selectionCandidate = false;
  export let disabled = false;
  export let readonly = false;
  export let showArchiveIcon = false;
  export let showStackedIcon = true;
  export let disableMouseOver = false;
  export let intersectionConfig: {
    root?: HTMLElement;
    bottom?: string;
    top?: string;
    left?: string;
    priority?: number;
    disabled?: boolean;
  } = {};

  export let retrieveElement: boolean = false;
  export let onIntersected: (() => void) | undefined = undefined;
  export let onClick: ((asset: AssetResponseDto) => void) | undefined = undefined;
  export let onRetrieveElement: ((elment: HTMLElement) => void) | undefined = undefined;
  export let onSelect: ((asset: AssetResponseDto) => void) | undefined = undefined;
  export let onMouseEvent: ((event: { isMouseOver: boolean; selectedGroupIndex: number }) => void) | undefined =
    undefined;

  let className = '';
  export { className as class };

  let {
    IMAGE_THUMBNAIL: { THUMBHASH_FADE_DURATION },
  } = TUNABLES;

  const componentId = generateId();
  let element: HTMLElement | undefined;
  let mouseOver = false;
  let intersecting = false;
  let lastRetrievedElement: HTMLElement | undefined;
  let loaded = false;

  $: if (!retrieveElement) {
    lastRetrievedElement = undefined;
  }
  $: if (retrieveElement && element && lastRetrievedElement !== element) {
    lastRetrievedElement = element;
    onRetrieveElement?.(element);
  }

  $: width = thumbnailSize || thumbnailWidth || 235;
  $: height = thumbnailSize || thumbnailHeight || 235;
  $: display = intersecting;

  const onIconClickedHandler = (e?: MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!disabled) {
      onSelect?.(asset);
    }
  };

  const callClickHandlers = () => {
    if (selected) {
      onIconClickedHandler();
      return;
    }
    onClick?.(asset);
  };
  const handleClick = (e: MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    callClickHandlers();
  };

  const _onMouseEnter = () => {
    mouseOver = true;
    onMouseEvent?.({ isMouseOver: true, selectedGroupIndex: groupIndex });
  };

  const onMouseEnter = () => {
    if (dateGroup && assetStore) {
      assetStore.taskManager.queueScrollSensitiveTask({ componentId, task: () => _onMouseEnter() });
    } else {
      _onMouseEnter();
    }
  };

  const onMouseLeave = () => {
    if (dateGroup && assetStore) {
      assetStore.taskManager.queueScrollSensitiveTask({ componentId, task: () => (mouseOver = false) });
    } else {
      mouseOver = false;
    }
  };

  const _onIntersect = () => {
    intersecting = true;
    onIntersected?.();
  };

  const onIntersect = () => {
    if (intersecting === true) {
      return;
    }
    if (dateGroup && assetStore) {
      assetStore.taskManager.intersectedThumbnail(componentId, dateGroup, asset, () => void _onIntersect());
    } else {
      void _onIntersect();
    }
  };

  const onSeparate = () => {
    if (intersecting === false) {
      return;
    }
    if (dateGroup && assetStore) {
      assetStore.taskManager.separatedThumbnail(componentId, dateGroup, asset, () => (intersecting = false));
    } else {
      intersecting = false;
    }
  };

  onDestroy(() => {
    assetStore?.taskManager.removeAllTasksForComponent(componentId);
  });
</script>

<div
  bind:this={element}
  use:intersectionObserver={{
    ...intersectionConfig,
    onIntersect,
    onSeparate,
  }}
  data-asset={asset.id}
  data-int={intersecting}
  style:width="{width}px"
  style:height="{height}px"
  class="focus-visible:outline-none flex overflow-hidden {disabled
    ? 'bg-gray-300'
    : 'bg-immich-primary/20 dark:bg-immich-dark-primary/20'}"
>
  {#if !loaded && asset.thumbhash}
    <canvas
      use:thumbhash={{ base64ThumbHash: asset.thumbhash }}
      class="absolute object-cover z-10"
      style:width="{width}px"
      style:height="{height}px"
      out:fade={{ duration: THUMBHASH_FADE_DURATION }}
    ></canvas>
  {/if}

  {#if display}
    <!-- svelte queries for all links on afterNavigate, leading to performance problems in asset-grid which updates
     the navigation url on scroll. Replace this with button for now. -->
    <div
      class="group"
      class:cursor-not-allowed={disabled}
      class:cursor-pointer={!disabled}
      on:mouseenter={onMouseEnter}
      on:mouseleave={onMouseLeave}
      on:keypress={(evt) => {
        if (evt.key === 'Enter') {
          callClickHandlers();
        }
      }}
      tabindex={0}
      on:click={handleClick}
      role="link"
    >
      {#if mouseOver && !disableMouseOver}
        <!-- lazy show the url on mouse over-->
        <a
          class="absolute z-30 {className} top-[41px]"
          style:cursor="unset"
          style:width="{width}px"
          style:height="{height}px"
          href={currentUrlReplaceAssetId(asset.id)}
          on:click={(evt) => evt.preventDefault()}
          tabindex={0}
        >
        </a>
      {/if}
      <div class="absolute z-20 {className}" style:width="{width}px" style:height="{height}px">
        <!-- Select asset button  -->
        {#if !readonly && (mouseOver || selected || selectionCandidate)}
          <button
            type="button"
            on:click={onIconClickedHandler}
            class="absolute p-2 focus:outline-none"
            class:cursor-not-allowed={disabled}
            role="checkbox"
            aria-checked={selected}
            {disabled}
          >
            {#if disabled}
              <Icon path={mdiCheckCircle} size="24" class="text-zinc-800" />
            {:else if selected}
              <div class="rounded-full bg-[#D9DCEF] dark:bg-[#232932]">
                <Icon path={mdiCheckCircle} size="24" class="text-immich-primary" />
              </div>
            {:else}
              <Icon path={mdiCheckCircle} size="24" class="text-white/80 hover:text-white" />
            {/if}
          </button>
        {/if}
      </div>

      <div
        class="absolute h-full w-full select-none bg-transparent transition-transform"
        class:scale-[0.85]={selected}
        class:rounded-xl={selected}
      >
        <!-- Gradient overlay on hover -->
        <div
          class="absolute z-10 h-full w-full bg-gradient-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100"
          class:rounded-xl={selected}
        />

        <!-- Outline on focus -->
        <div
          class="absolute size-full group-focus-visible:outline outline-4 -outline-offset-4 outline-immich-primary"
        />

        <!-- Favorite asset star -->
        {#if !isSharedLink() && asset.isFavorite}
          <div class="absolute bottom-2 left-2 z-10">
            <Icon path={mdiHeart} size="24" class="text-white" />
          </div>
        {/if}

        {#if !isSharedLink() && showArchiveIcon && asset.isArchived}
          <div class="absolute {asset.isFavorite ? 'bottom-10' : 'bottom-2'} left-2 z-10">
            <Icon path={mdiArchiveArrowDownOutline} size="24" class="text-white" />
          </div>
        {/if}

        {#if asset.type === AssetTypeEnum.Image && asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR}
          <div class="absolute right-0 top-0 z-20 flex place-items-center gap-1 text-xs font-medium text-white">
            <span class="pr-2 pt-2">
              <Icon path={mdiRotate360} size="24" />
            </span>
          </div>
        {/if}

        <!-- Stacked asset -->

        {#if asset.stack && showStackedIcon}
          <div
            class="absolute {asset.type == AssetTypeEnum.Image && asset.livePhotoVideoId == undefined
              ? 'top-0 right-0'
              : 'top-7 right-1'} z-20 flex place-items-center gap-1 text-xs font-medium text-white"
          >
            <span class="pr-2 pt-2 flex place-items-center gap-1">
              <p>{asset.stack.assetCount.toLocaleString($locale)}</p>
              <Icon path={mdiCameraBurst} size="24" />
            </span>
          </div>
        {/if}

        <ImageThumbnail
          url={getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Thumbnail, checksum: asset.checksum })}
          altText={$getAltText(asset)}
          widthStyle="{width}px"
          heightStyle="{height}px"
          curve={selected}
          onComplete={() => (loaded = true)}
        />

        {#if asset.type === AssetTypeEnum.Video}
          <div class="absolute top-0 h-full w-full">
            <VideoThumbnail
              {assetStore}
              url={getAssetPlaybackUrl({ id: asset.id, checksum: asset.checksum })}
              enablePlayback={mouseOver && $playVideoThumbnailOnHover}
              curve={selected}
              durationInSeconds={timeToSeconds(asset.duration)}
              playbackOnIconHover
            />
          </div>
        {/if}

        {#if asset.type === AssetTypeEnum.Image && asset.livePhotoVideoId}
          <div class="absolute top-0 h-full w-full">
            <VideoThumbnail
              {assetStore}
              url={getAssetPlaybackUrl({ id: asset.livePhotoVideoId, checksum: asset.checksum })}
              pauseIcon={mdiMotionPauseOutline}
              playIcon={mdiMotionPlayOutline}
              showTime={false}
              curve={selected}
              playbackOnIconHover
            />
          </div>
        {/if}
      </div>
      {#if selectionCandidate}
        <div
          class="absolute top-0 h-full w-full bg-immich-primary opacity-40"
          in:fade={{ duration: 100 }}
          out:fade={{ duration: 100 }}
        />
      {/if}
    </div>
  {/if}
</div>
