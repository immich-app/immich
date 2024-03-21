<script lang="ts">
  import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { ProjectionType } from '$lib/constants';
  import { getAssetFileUrl, getAssetThumbnailUrl, isSharedLink } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { timeToSeconds } from '$lib/utils/date-time';
  import { AssetTypeEnum, ThumbnailFormat, type AssetResponseDto } from '@immich/sdk';
  import { playVideoThumbnailOnHover } from '$lib/stores/preferences.store';
  import {
    mdiArchiveArrowDownOutline,
    mdiCameraBurst,
    mdiCheckCircle,
    mdiHeart,
    mdiImageBrokenVariant,
    mdiMotionPauseOutline,
    mdiMotionPlayOutline,
    mdiRotate360,
  } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import ImageThumbnail from './image-thumbnail.svelte';
  import VideoThumbnail from './video-thumbnail.svelte';
  import { shortcut } from '$lib/utils/shortcut';

  const dispatch = createEventDispatcher<{
    select: { asset: AssetResponseDto };
    'mouse-event': { isMouseOver: boolean; selectedGroupIndex: number };
  }>();

  export let asset: AssetResponseDto;
  export let groupIndex = 0;
  export let thumbnailSize: number | undefined = undefined;
  export let thumbnailWidth: number | undefined = undefined;
  export let thumbnailHeight: number | undefined = undefined;
  export let format: ThumbnailFormat = ThumbnailFormat.Webp;
  export let selected = false;
  export let selectionCandidate = false;
  export let disabled = false;
  export let readonly = false;
  export let showArchiveIcon = false;
  export let showStackedIcon = true;
  export let onClick: ((asset: AssetResponseDto) => void) | undefined = undefined;

  let className = '';
  export { className as class };

  let mouseOver = false;
  $: clickable = !disabled && onClick;

  $: dispatch('mouse-event', { isMouseOver: mouseOver, selectedGroupIndex: groupIndex });

  $: [width, height] = ((): [number, number] => {
    if (thumbnailSize) {
      return [thumbnailSize, thumbnailSize];
    }

    if (thumbnailWidth && thumbnailHeight) {
      return [thumbnailWidth, thumbnailHeight];
    }

    return [235, 235];
  })();

  const thumbnailClickedHandler = () => {
    if (clickable) {
      onClick?.(asset);
    }
  };

  const onIconClickedHandler = (e: MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      dispatch('select', { asset });
    }
  };

  const onMouseEnter = () => {
    mouseOver = true;
  };

  const onMouseLeave = () => {
    mouseOver = false;
  };
</script>

<IntersectionObserver once={false} on:intersected let:intersecting>
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <div
    style:width="{width}px"
    style:height="{height}px"
    class="group focus-visible:outline-none relative overflow-hidden {disabled
      ? 'bg-gray-300'
      : 'bg-immich-primary/20 dark:bg-immich-dark-primary/20'}"
    class:cursor-not-allowed={disabled}
    class:hover:cursor-pointer={clickable}
    on:mouseenter={onMouseEnter}
    on:mouseleave={onMouseLeave}
    role={clickable ? 'button' : undefined}
    tabindex={clickable ? 0 : undefined}
    on:click={thumbnailClickedHandler}
    use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: thumbnailClickedHandler }}
  >
    {#if intersecting}
      <div class="absolute z-20 h-full w-full {className}">
        <!-- Select asset button  -->
        {#if !readonly && (mouseOver || selected || selectionCandidate)}
          <button
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
        class="absolute h-full w-full select-none bg-gray-100 transition-transform dark:bg-immich-dark-gray"
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

        {#if asset.stackCount && showStackedIcon}
          <div
            class="absolute {asset.type == AssetTypeEnum.Image && asset.livePhotoVideoId == undefined
              ? 'top-0 right-0'
              : 'top-7 right-1'} z-20 flex place-items-center gap-1 text-xs font-medium text-white"
          >
            <span class="pr-2 pt-2 flex place-items-center gap-1">
              <p>{asset.stackCount}</p>
              <Icon path={mdiCameraBurst} size="24" />
            </span>
          </div>
        {/if}

        {#if asset.resized}
          <ImageThumbnail
            url={getAssetThumbnailUrl(asset.id, format)}
            altText={getAltText(asset)}
            widthStyle="{width}px"
            heightStyle="{height}px"
            thumbhash={asset.thumbhash}
            curve={selected}
          />
        {:else}
          <div class="flex h-full w-full items-center justify-center p-4">
            <Icon path={mdiImageBrokenVariant} size="48" />
          </div>
        {/if}

        {#if asset.type === AssetTypeEnum.Video}
          <div class="absolute top-0 h-full w-full">
            <VideoThumbnail
              url={getAssetFileUrl(asset.id, false, true)}
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
              url={getAssetFileUrl(asset.livePhotoVideoId, false, true)}
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
    {/if}
  </div>
</IntersectionObserver>
