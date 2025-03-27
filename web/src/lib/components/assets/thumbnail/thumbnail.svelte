<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { ProjectionType } from '$lib/constants';
  import { locale, playVideoThumbnailOnHover } from '$lib/stores/preferences.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl, isSharedLink } from '$lib/utils';
  import { timeToSeconds } from '$lib/utils/date-time';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { AssetMediaSize, AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
  import {
    mdiArchiveArrowDownOutline,
    mdiCameraBurst,
    mdiCheckCircle,
    mdiHeart,
    mdiMotionPauseOutline,
    mdiMotionPlayOutline,
    mdiRotate360,
  } from '@mdi/js';

  import { thumbhash } from '$lib/actions/thumbhash';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { currentUrlReplaceAssetId } from '$lib/utils/navigation';
  import { TUNABLES } from '$lib/utils/tunables';
  import type { ClassValue } from 'svelte/elements';
  import { fade } from 'svelte/transition';
  import ImageThumbnail from './image-thumbnail.svelte';
  import VideoThumbnail from './video-thumbnail.svelte';

  interface Props {
    asset: AssetResponseDto;
    groupIndex?: number;
    thumbnailSize?: number | undefined;
    thumbnailWidth?: number | undefined;
    thumbnailHeight?: number | undefined;
    selected?: boolean;
    focussed?: boolean;
    selectionCandidate?: boolean;
    disabled?: boolean;
    disableLinkMouseOver?: boolean;
    readonly?: boolean;
    showArchiveIcon?: boolean;
    showStackedIcon?: boolean;
    imageClass?: ClassValue;
    dimmed?: boolean;
    onClick?: ((asset: AssetResponseDto) => void) | undefined;
    onSelect?: ((asset: AssetResponseDto) => void) | undefined;
    onMouseEvent?: ((event: { isMouseOver: boolean; selectedGroupIndex: number }) => void) | undefined;
    handleFocus?: (() => void) | undefined;
    class?: ClassValue;
  }

  let {
    asset = $bindable(),
    groupIndex = 0,
    thumbnailSize = undefined,
    thumbnailWidth = undefined,
    thumbnailHeight = undefined,
    selected = false,
    focussed = false,
    selectionCandidate = false,
    disabled = false,
    disableLinkMouseOver = false,
    readonly = false,
    showArchiveIcon = false,
    showStackedIcon = true,
    onClick = undefined,
    onSelect = undefined,
    onMouseEvent = undefined,
    handleFocus = undefined,
    class: className = '',
    imageClass = '',
    dimmed = false,
  }: Props = $props();

  let {
    IMAGE_THUMBNAIL: { THUMBHASH_FADE_DURATION },
  } = TUNABLES;

  let usingMobileDevice = $derived(mobileDevice.pointerCoarse);
  let focussableElement: HTMLElement | undefined = $state();
  let mouseOver = $state(false);
  let loaded = $state(false);

  $effect(() => {
    if (focussed && document.activeElement !== focussableElement) {
      focussableElement?.focus();
    }
  });

  let width = $derived(thumbnailSize || thumbnailWidth || 235);
  let height = $derived(thumbnailSize || thumbnailHeight || 235);

  const onIconClickedHandler = (e?: MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!disabled) {
      onSelect?.($state.snapshot(asset));
    }
  };

  const callClickHandlers = () => {
    if (selected) {
      onIconClickedHandler();
      return;
    }
    onClick?.($state.snapshot(asset));
  };

  const handleClick = (e: MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    callClickHandlers();
  };

  const onMouseEnter = () => {
    if (usingMobileDevice) {
      return;
    }
    mouseOver = true;
    onMouseEvent?.({ isMouseOver: true, selectedGroupIndex: groupIndex });
  };

  const onMouseLeave = () => {
    mouseOver = false;
  };

  function longPress(element: HTMLElement, { onLongPress }: { onLongPress: () => void }) {
    let timer: ReturnType<typeof setTimeout>;
    const start = (event: TouchEvent) => {
      timer = setTimeout(() => {
        onLongPress();
        event.preventDefault();
      }, 350);
    };
    const end = () => clearTimeout(timer);
    element.addEventListener('touchstart', start);
    element.addEventListener('touchend', end);
    return {
      destroy: () => {
        element.removeEventListener('touchstart', start);
        element.removeEventListener('touchend', end);
      },
    };
  }
</script>

<div
  data-asset={asset.id}
  class={[
    'focus-visible:outline-none flex overflow-hidden',
    disabled ? 'bg-gray-300' : 'bg-immich-primary/20 dark:bg-immich-dark-primary/20',
  ]}
  style:width="{width}px"
  style:height="{height}px"
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

  <!-- as of iOS17, there is a preference for long press speed, which is not available for mobile web.
      The defaults are as follows:
      fast: 200ms
      default: 500ms
      slow: ??ms
      -->
  <div
    class={['group w-full top-[0px] bottom-[0px]', { 'curstor-not-allowed': disabled, 'cursor-pointer': !disabled }]}
    onmouseenter={onMouseEnter}
    onmouseleave={onMouseLeave}
    use:longPress={{ onLongPress: () => onSelect?.($state.snapshot(asset)) }}
    onkeydown={(evt) => {
      if (evt.key === 'Enter') {
        callClickHandlers();
      }
      if (evt.key === 'x') {
        onSelect?.(asset);
      }
    }}
    onclick={handleClick}
    bind:this={focussableElement}
    onfocus={handleFocus}
    data-testid="container-with-tabindex"
    tabindex={0}
    role="link"
  >
    <!-- Select asset button  -->
    {#if !usingMobileDevice && mouseOver && !disableLinkMouseOver}
      <!-- lazy show the url on mouse over-->
      <a
        class={['absolute  z-10 w-full top-0 bottom-0']}
        style:cursor="unset"
        href={currentUrlReplaceAssetId(asset.id)}
        onclick={(evt) => evt.preventDefault()}
        tabindex={-1}
        aria-label="Thumbnail URL"
      >
      </a>
    {/if}
    {#if !readonly && (mouseOver || selected || selectionCandidate)}
      <button
        type="button"
        onclick={onIconClickedHandler}
        class={['absolute z-20 p-2 focus:outline-none', { 'cursor-not-allowed': disabled }]}
        role="checkbox"
        tabindex={-1}
        onfocus={handleFocus}
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

    <div
      class={[
        'absolute h-full w-full select-none bg-transparent transition-transform',
        { 'scale-[0.85]': selected },
        { 'rounded-xl': selected },
      ]}
    >
      <!-- icon overlay -->
      <div>
        <!-- Gradient overlay on hover -->
        {#if !usingMobileDevice && !disabled}
          <div
            class={[
              'absolute h-full w-full bg-gradient-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100',
              { 'rounded-xl': selected },
            ]}
          ></div>
        {/if}
        <!-- Dimmed support -->

        {#if dimmed && !mouseOver}
          <div
            id="a"
            class={[
              'absolute h-full w-full z-30 bg-gradient-to-b from-black/25 via-[transparent_25%]  bg-gray-700/40',
              { 'rounded-xl': selected },
            ]}
          ></div>
        {/if}
        <!-- Outline on focus -->
        <div
          class={[
            'absolute size-full group-focus-visible:outline outline-4 -outline-offset-4 outline-immich-primary',
            { 'rounded-xl': selected },
          ]}
        ></div>

        <!-- Favorite asset star -->
        {#if !isSharedLink() && asset.isFavorite}
          <div class="absolute bottom-2 left-2 z-10">
            <Icon path={mdiHeart} size="24" class="text-white" />
          </div>
        {/if}

        {#if !isSharedLink() && showArchiveIcon && asset.isArchived}
          <div class={['absolute left-2 z-10', asset.isFavorite ? 'bottom-10' : 'bottom-2']}>
            <Icon path={mdiArchiveArrowDownOutline} size="24" class="text-white" />
          </div>
        {/if}

        {#if asset.type === AssetTypeEnum.Image && asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR}
          <div class="absolute right-0 top-0 z-10 flex place-items-center gap-1 text-xs font-medium text-white">
            <span class="pr-2 pt-2">
              <Icon path={mdiRotate360} size="24" />
            </span>
          </div>
        {/if}

        <!-- Stacked asset -->
        {#if asset.stack && showStackedIcon}
          <div
            class={[
              'absolute z-10 flex place-items-center gap-1 text-xs font-medium text-white',
              asset.type == AssetTypeEnum.Image && !asset.livePhotoVideoId ? 'top-0 right-0' : 'top-7 right-1',
            ]}
          >
            <span class="pr-2 pt-2 flex place-items-center gap-1">
              <p>{asset.stack.assetCount.toLocaleString($locale)}</p>
              <Icon path={mdiCameraBurst} size="24" />
            </span>
          </div>
        {/if}
      </div>
      <ImageThumbnail
        class={imageClass}
        url={getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Thumbnail, cacheKey: asset.thumbhash })}
        altText={$getAltText(asset)}
        widthStyle="{width}px"
        heightStyle="{height}px"
        curve={selected}
        onComplete={() => (loaded = true)}
      />
      {#if asset.type === AssetTypeEnum.Video}
        <div class="absolute top-0 h-full w-full">
          <VideoThumbnail
            url={getAssetPlaybackUrl({ id: asset.id, cacheKey: asset.thumbhash })}
            enablePlayback={mouseOver && $playVideoThumbnailOnHover}
            curve={selected}
            durationInSeconds={timeToSeconds(asset.duration)}
            playbackOnIconHover={!$playVideoThumbnailOnHover}
          />
        </div>
      {:else if asset.type === AssetTypeEnum.Image && asset.livePhotoVideoId}
        <div class="absolute top-0 h-full w-full">
          <VideoThumbnail
            url={getAssetPlaybackUrl({ id: asset.livePhotoVideoId, cacheKey: asset.thumbhash })}
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
      ></div>
    {/if}
  </div>
</div>
