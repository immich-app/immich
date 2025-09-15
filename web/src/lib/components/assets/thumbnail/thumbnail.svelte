<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { ProjectionType } from '$lib/constants';
  import { locale, playVideoThumbnailOnHover } from '$lib/stores/preferences.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { timeToSeconds } from '$lib/utils/date-time';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { AssetMediaSize, AssetVisibility } from '@immich/sdk';
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
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { moveFocus } from '$lib/utils/focus-util';
  import { currentUrlReplaceAssetId } from '$lib/utils/navigation';
  import { TUNABLES } from '$lib/utils/tunables';
  import { onMount } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { fade } from 'svelte/transition';
  import ImageThumbnail from './image-thumbnail.svelte';
  import VideoThumbnail from './video-thumbnail.svelte';

  interface Props {
    asset: TimelineAsset;
    groupIndex?: number;
    thumbnailSize?: number;
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    selected?: boolean;
    selectionCandidate?: boolean;
    disabled?: boolean;
    disableLinkMouseOver?: boolean;
    readonly?: boolean;
    showArchiveIcon?: boolean;
    showStackedIcon?: boolean;
    imageClass?: ClassValue;
    brokenAssetClass?: ClassValue;
    dimmed?: boolean;
    onClick?: (asset: TimelineAsset) => void;
    onSelect?: (asset: TimelineAsset) => void;
    onMouseEvent?: (event: { isMouseOver: boolean; selectedGroupIndex: number }) => void;
  }

  let {
    asset = $bindable(),
    groupIndex = 0,
    thumbnailSize = undefined,
    thumbnailWidth = undefined,
    thumbnailHeight = undefined,
    selected = false,
    selectionCandidate = false,
    disabled = false,
    disableLinkMouseOver = false,
    readonly = false,
    showArchiveIcon = false,
    showStackedIcon = true,
    onClick = undefined,
    onSelect = undefined,
    onMouseEvent = undefined,
    imageClass = '',
    brokenAssetClass = '',
    dimmed = false,
  }: Props = $props();

  let {
    IMAGE_THUMBNAIL: { THUMBHASH_FADE_DURATION },
  } = TUNABLES;

  let usingMobileDevice = $derived(mobileDevice.pointerCoarse);
  let element: HTMLElement | undefined = $state();
  let mouseOver = $state(false);
  let loaded = $state(false);
  let thumbError = $state(false);

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
      window.open(currentUrlReplaceAssetId(asset.id), '_blank');
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

  let timer: ReturnType<typeof setTimeout> | null = null;

  const preventContextMenu = (evt: Event) => evt.preventDefault();
  const disposeables: (() => void)[] = [];

  const clearLongPressTimer = () => {
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    timer = null;
    for (const dispose of disposeables) {
      dispose();
    }
    disposeables.length = 0;
  };

  let startX: number = 0;
  let startY: number = 0;

  function longPress(element: HTMLElement, { onLongPress }: { onLongPress: () => void }) {
    let didPress = false;
    const start = (evt: PointerEvent) => {
      startX = evt.clientX;
      startY = evt.clientY;
      didPress = false;
      // 350ms for longpress. For reference: iOS uses 500ms for default long press, or 200ms for fast long press.
      timer = setTimeout(() => {
        onLongPress();
        element.addEventListener('contextmenu', preventContextMenu, { once: true });
        disposeables.push(() => element.removeEventListener('contextmenu', preventContextMenu));
        didPress = true;
      }, 350);
    };
    const click = (e: MouseEvent) => {
      if (!didPress) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
    };
    element.addEventListener('click', click);
    element.addEventListener('pointerdown', start, true);
    element.addEventListener('pointerup', clearLongPressTimer, { capture: true, passive: true });
    return {
      destroy: () => {
        element.removeEventListener('click', click);
        element.removeEventListener('pointerdown', start, true);
        element.removeEventListener('pointerup', clearLongPressTimer, true);
      },
    };
  }
  function moveHandler(e: PointerEvent) {
    if (Math.abs(startX - e.clientX) >= 10 || Math.abs(startY - e.clientY) >= 10) {
      clearLongPressTimer();
    }
  }
  onMount(() => {
    document.addEventListener('scroll', clearLongPressTimer, { capture: true, passive: true });
    document.addEventListener('wheel', clearLongPressTimer, { capture: true, passive: true });
    document.addEventListener('contextmenu', clearLongPressTimer, { capture: true, passive: true });
    document.addEventListener('pointermove', moveHandler, { capture: true, passive: true });
    return () => {
      document.removeEventListener('scroll', clearLongPressTimer, true);
      document.removeEventListener('wheel', clearLongPressTimer, true);
      document.removeEventListener('contextmenu', clearLongPressTimer, true);
      document.removeEventListener('pointermove', moveHandler, true);
    };
  });
</script>

<div
  class={[
    'focus-visible:outline-none flex overflow-hidden',
    disabled ? 'bg-gray-300' : 'dark:bg-neutral-700 bg-neutral-200',
  ]}
  style:width="{width}px"
  style:height="{height}px"
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
    if (document.activeElement === element && evt.key === 'Escape') {
      moveFocus((element) => element.dataset.thumbnailFocusContainer === undefined, 'next');
    }
  }}
  onclick={handleClick}
  bind:this={element}
  data-asset={asset.id}
  data-thumbnail-focus-container
  tabindex={0}
  role="link"
>
  <!-- Outline on focus -->
  <div
    class={[
      'pointer-events-none absolute z-1 size-full outline-hidden outline-4 -outline-offset-4 outline-immich-primary',
      { 'rounded-xl': selected },
    ]}
    data-outline
  ></div>

  <div
    class={['group absolute -top-[0px] -bottom-[0px]', { 'cursor-not-allowed': disabled, 'cursor-pointer': !disabled }]}
    style:width="inherit"
    style:height="inherit"
  >
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
              'absolute h-full w-full bg-linear-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100',
              { 'rounded-xl': selected },
            ]}
          ></div>
        {/if}

        <!-- Dimmed support -->
        {#if dimmed && !mouseOver}
          <div id="a" class={['absolute h-full w-full bg-gray-700/40', { 'rounded-xl': selected }]}></div>
        {/if}

        <!-- Favorite asset star -->
        {#if !authManager.isSharedLink && asset.isFavorite}
          <div class="absolute bottom-2 start-2">
            <Icon path={mdiHeart} size="24" class="text-white" />
          </div>
        {/if}

        {#if !authManager.isSharedLink && showArchiveIcon && asset.visibility === AssetVisibility.Archive}
          <div class={['absolute start-2', asset.isFavorite ? 'bottom-10' : 'bottom-2']}>
            <Icon path={mdiArchiveArrowDownOutline} size="24" class="text-white" />
          </div>
        {/if}

        {#if asset.isImage && asset.projectionType === ProjectionType.EQUIRECTANGULAR}
          <div class="absolute end-0 top-0 flex place-items-center gap-1 text-xs font-medium text-white">
            <span class="pe-2 pt-2">
              <Icon path={mdiRotate360} size="24" />
            </span>
          </div>
        {/if}

        <!-- Stacked asset -->
        {#if asset.stack && showStackedIcon}
          <div
            class={[
              'absolute flex place-items-center gap-1 text-xs font-medium text-white',
              asset.isImage && !asset.livePhotoVideoId ? 'top-0 end-0' : 'top-7 end-1',
            ]}
          >
            <span class="pe-2 pt-2 flex place-items-center gap-1">
              <p>{asset.stack.assetCount.toLocaleString($locale)}</p>
              <Icon path={mdiCameraBurst} size="24" />
            </span>
          </div>
        {/if}
      </div>

      <!-- lazy show the url on mouse over-->
      {#if !usingMobileDevice && mouseOver && !disableLinkMouseOver}
        <a
          class="absolute w-full top-0 bottom-0"
          style:cursor="unset"
          href={currentUrlReplaceAssetId(asset.id)}
          onclick={(evt) => evt.preventDefault()}
          tabindex={-1}
          aria-label="Thumbnail URL"
        >
        </a>
      {/if}

      <ImageThumbnail
        class={imageClass}
        {brokenAssetClass}
        url={getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Thumbnail, cacheKey: asset.thumbhash })}
        altText={$getAltText(asset)}
        widthStyle="{width}px"
        heightStyle="{height}px"
        curve={selected}
        onComplete={(errored) => ((loaded = true), (thumbError = errored))}
      />
      {#if asset.isVideo}
        <div class="absolute top-0 h-full w-full pointer-events-none">
          <VideoThumbnail
            url={getAssetPlaybackUrl({ id: asset.id, cacheKey: asset.thumbhash })}
            enablePlayback={mouseOver && $playVideoThumbnailOnHover}
            curve={selected}
            durationInSeconds={asset.duration ? timeToSeconds(asset.duration) : 0}
            playbackOnIconHover={!$playVideoThumbnailOnHover}
          />
        </div>
      {:else if asset.isImage && asset.livePhotoVideoId}
        <div class="absolute top-0 h-full w-full pointer-events-none">
          <VideoThumbnail
            url={getAssetPlaybackUrl({ id: asset.livePhotoVideoId, cacheKey: asset.thumbhash })}
            enablePlayback={mouseOver && $playVideoThumbnailOnHover}
            pauseIcon={mdiMotionPauseOutline}
            playIcon={mdiMotionPlayOutline}
            showTime={false}
            curve={selected}
            playbackOnIconHover={!$playVideoThumbnailOnHover}
          />
        </div>
      {/if}

      {#if (!loaded || thumbError) && asset.thumbhash}
        <canvas
          use:thumbhash={{ base64ThumbHash: asset.thumbhash }}
          data-testid="thumbhash"
          class="absolute top-0 object-cover"
          style:width="{width}px"
          style:height="{height}px"
          class:rounded-xl={selected}
          draggable="false"
          out:fade={{ duration: THUMBHASH_FADE_DURATION }}
        ></canvas>
      {/if}
    </div>

    {#if selectionCandidate}
      <div
        class="absolute top-0 h-full w-full bg-immich-primary opacity-40"
        in:fade={{ duration: 100 }}
        out:fade={{ duration: 100 }}
      ></div>
    {/if}

    <!-- Select asset button  -->
    {#if !readonly && (mouseOver || selected || selectionCandidate)}
      <button
        type="button"
        onclick={onIconClickedHandler}
        class={['absolute p-2 focus:outline-none', { 'cursor-not-allowed': disabled }]}
        role="checkbox"
        tabindex={-1}
        aria-checked={selected}
        {disabled}
      >
        {#if disabled}
          <Icon path={mdiCheckCircle} size="24" class="text-zinc-800" />
        {:else if selected}
          <div class="rounded-full bg-[#D9DCEF] dark:bg-[#232932]">
            <Icon path={mdiCheckCircle} size="24" class="text-primary" />
          </div>
        {:else}
          <Icon path={mdiCheckCircle} size="24" class="text-white/80 hover:text-white" />
        {/if}
      </button>
    {/if}
  </div>
</div>

<style>
  [data-asset]:focus > [data-outline] {
    outline-style: solid;
  }
</style>
