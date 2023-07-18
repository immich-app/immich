<script lang="ts">
  import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
  import { timeToSeconds } from '$lib/utils/time-to-seconds';
  import { api, AssetResponseDto, AssetTypeEnum, ThumbnailFormat } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
  import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
  import Heart from 'svelte-material-icons/Heart.svelte';
  import ImageBrokenVariant from 'svelte-material-icons/ImageBrokenVariant.svelte';
  import MotionPauseOutline from 'svelte-material-icons/MotionPauseOutline.svelte';
  import MotionPlayOutline from 'svelte-material-icons/MotionPlayOutline.svelte';
  import { fade } from 'svelte/transition';
  import ImageThumbnail from './image-thumbnail.svelte';
  import VideoThumbnail from './video-thumbnail.svelte';

  const dispatch = createEventDispatcher();

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
  export let publicSharedKey: string | undefined = undefined;
  export let showArchiveIcon = false;

  let mouseOver = false;

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
    if (!disabled) {
      dispatch('click', { asset });
    }
  };

  const thumbnailKeyDownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      thumbnailClickedHandler();
    }
  };

  const onIconClickedHandler = (e: MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      dispatch('select', { asset });
    }
  };
</script>

<IntersectionObserver once={false} let:intersecting>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    style:width="{width}px"
    style:height="{height}px"
    class="group relative overflow-hidden {disabled
      ? 'bg-gray-300'
      : 'bg-immich-primary/20 dark:bg-immich-dark-primary/20'}"
    class:cursor-not-allowed={disabled}
    class:hover:cursor-pointer={!disabled}
    on:mouseenter={() => (mouseOver = true)}
    on:mouseleave={() => (mouseOver = false)}
    on:click={thumbnailClickedHandler}
    on:keydown={thumbnailKeyDownHandler}
  >
    {#if intersecting}
      <div class="absolute z-20 h-full w-full">
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
              <CheckCircle size="24" class="text-zinc-800" />
            {:else if selected}
              <CheckCircle size="24" class="text-immich-primary" />
            {:else}
              <CheckCircle size="24" class="text-white/80 hover:text-white" />
            {/if}
          </button>
        {/if}
      </div>

      <div
        class="absolute h-full w-full select-none bg-gray-100 transition-transform dark:bg-immich-dark-gray"
        class:scale-[0.85]={selected}
      >
        <!-- Gradient overlay on hover -->
        <div
          class="absolute z-10 h-full w-full bg-gradient-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100"
        />

        <!-- Favorite asset star -->
        {#if asset.isFavorite && !publicSharedKey}
          <div class="absolute bottom-2 left-2 z-10">
            <Heart size="24" class="text-white" />
          </div>
        {/if}

        {#if showArchiveIcon && asset.isArchived}
          <div class="absolute {asset.isFavorite ? 'bottom-10' : 'bottom-2'} left-2 z-10">
            <ArchiveArrowDownOutline size="24" class="text-white" />
          </div>
        {/if}

        {#if asset.resized}
          <ImageThumbnail
            url={api.getAssetThumbnailUrl(asset.id, format, publicSharedKey)}
            altText={asset.originalFileName}
            widthStyle="{width}px"
            heightStyle="{height}px"
            thumbhash={asset.thumbhash}
          />
        {:else}
          <div class="flex h-full w-full items-center justify-center p-4">
            <ImageBrokenVariant size="48" />
          </div>
        {/if}

        {#if asset.type === AssetTypeEnum.Video}
          <div class="absolute top-0 h-full w-full">
            <VideoThumbnail
              url={api.getAssetFileUrl(asset.id, false, true, publicSharedKey)}
              enablePlayback={mouseOver}
              durationInSeconds={timeToSeconds(asset.duration)}
            />
          </div>
        {/if}

        {#if asset.type === AssetTypeEnum.Image && asset.livePhotoVideoId}
          <div class="absolute top-0 h-full w-full">
            <VideoThumbnail
              url={api.getAssetFileUrl(asset.livePhotoVideoId, false, true, publicSharedKey)}
              pauseIcon={MotionPauseOutline}
              playIcon={MotionPlayOutline}
              showTime={false}
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
