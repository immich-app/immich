<script lang="ts">
  import { thumbhash } from '$lib/actions/thumbhash';
  import { ProjectionType } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { locale, playVideoThumbnailOnHover } from '$lib/stores/preferences.store';
  import { getAssetOriginalUrl, getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { timeToSeconds } from '$lib/utils/date-time';
  import { moveFocus } from '$lib/utils/focus-util';
  import { currentUrlReplaceAssetId } from '$lib/utils/navigation';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { TUNABLES } from '$lib/utils/tunables';
  import { AssetMediaSize, AssetVisibility, type UserResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import {
    mdiArchiveArrowDownOutline,
    mdiCameraBurst,
    mdiCheckCircle,
    mdiFileGifBox,
    mdiHeart,
    mdiMotionPauseOutline,
    mdiMotionPlayOutline,
    mdiRotate360,
  } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';

  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { cubicOut } from 'svelte/easing';
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
    albumUsers?: UserResponseDto[];
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
    albumUsers = [],
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

  let assetOwner = $derived(albumUsers?.find((user) => user.id === asset.ownerId) ?? null);

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

  const handleClick = async (e: MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      window.open(currentUrlReplaceAssetId(asset.id), '_blank');
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    // callClickHandlers();

    // rect = element?.getBoundingClientRect();
    // console.log('rect', rect, element);
    // await tick();
    // const html = document.querySelector('html')!;
    // viewport = {
    //   width: html.clientWidth,
    //   height: html.clientHeight,
    // };
    // console.log(rect, viewport, imageWithinRect);
    // transitionToAssetViewer = true;
    // await tick();
    // transitionToAssetViewer = false;
    // assetViewingStore.invisible.set(true);
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
  onDestroy(() => {});

  let transitionToAssetViewer = $state(false);
  let rect = $state<DOMRect>();
  let viewport = $state<{ width: number; height: number }>();

  // Calculate the image position within rect such that when rect scales to viewport, image is centered
  let imageWithinRect = $derived.by(() => {
    if (!viewport || !rect) {
      return null;
    }

    const imageAspect = asset.ratio; // width / height
    const viewportAspect = viewport.width / viewport.height;

    // Calculate where image should be in the final fullscreen state
    let finalWidth: number;
    let finalHeight: number;
    let finalLeft: number;
    let finalTop: number;

    if (imageAspect > viewportAspect) {
      // Image is wider - fit to width, black bars top/bottom
      finalWidth = viewport.width;
      finalHeight = viewport.width / imageAspect;
      finalLeft = 0;
      finalTop = (viewport.height - finalHeight) / 2;
    } else {
      // Image is taller - fit to height, black bars left/right
      finalHeight = viewport.height;
      finalWidth = viewport.height * imageAspect;
      finalTop = 0;
      finalLeft = (viewport.width - finalWidth) / 2;
    }

    // Scale these coordinates down to fit within rect
    // The rect will scale from rect size to viewport size
    const scaleX = rect.width / viewport.width;
    const scaleY = rect.height / viewport.height;

    return {
      width: finalWidth * scaleX,
      height: finalHeight * scaleY,
      left: finalLeft * scaleX,
      top: finalTop * scaleY,
    };
  });
  /**
   * @param {Element} element
   */
  function get_zoom(element) {
    if ('currentCSSZoom' in element) {
      return /** @type {number} */ (element.currentCSSZoom);
    }

    /** @type {Element | null} */
    var current = element;
    var zoom = 1;

    while (current !== null) {
      zoom *= +getComputedStyle(current).zoom;
      current = /** @type {Element | null} */ (current.parentElement);
    }

    return zoom;
  }
  function flip(node, params) {
    var { from, to, delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;

    var style = getComputedStyle(node);

    // find the transform origin, expressed as a pair of values between 0 and 1
    var transform = style.transform === 'none' ? '' : style.transform;
    var [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
    ox /= node.clientWidth;
    oy /= node.clientHeight;

    // calculate effect of parent transforms and zoom
    var zoom = get_zoom(node); // https://drafts.csswg.org/css-viewport/#effective-zoom
    var sx = node.clientWidth / to.width / zoom;
    var sy = node.clientHeight / to.height / zoom;

    // find the starting position of the transform origin
    var fx = from.left + from.width * ox;
    var fy = from.top + from.height * oy;

    // find the ending position of the transform origin
    var tx = to.left + to.width * ox;
    var ty = to.top + to.height * oy;

    // find the translation at the start of the transform
    var dx = (fx - tx) * sx;
    var dy = (fy - ty) * sy;

    // find the relative scale at the start of the transform
    var dsx = from.width / to.width;
    var dsy = from.height / to.height;

    return {
      delay,
      duration: typeof duration === 'function' ? duration(Math.sqrt(dx * dx + dy * dy)) : duration,
      easing,
      css: (t, u) => {
        var x = u * dx;
        var y = u * dy;
        var sx = t + u * dsx;
        var sy = t + u * dsy;

        return `transform: ${transform} translate(${x}px, ${y}px) scale(${sx}, ${sy});`;
      },
    };
  }
</script>

{#if transitionToAssetViewer}
  <Portal target="body"
    ><div id="hello" style="position: absolute; top:0;left:0;right:0;bottom:0; z-index: 100;">
      <div
        style:position="absolute"
        style:top={(rect?.top ?? 0) + 'px'}
        style:left={(rect?.left ?? 0) + 'px'}
        style:width={(rect?.width ?? 0) + 'px'}
        style:height={(rect?.height ?? 0) + 'px'}
        style:background-color="black"
        out:flip={{ to: rect!, from: new DOMRect(0, 0, viewport?.width, viewport?.height), duration: 300 }}
        onoutroend={() => assetViewingStore.invisible.set(false)}
      >
        <img
          src={getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Preview, cacheKey: asset.thumbhash })}
          style:position="absolute"
          style:top={imageWithinRect.top + 'px'}
          style:left={imageWithinRect.left + 'px'}
          style:width={imageWithinRect.width + 'px'}
          style:height={imageWithinRect.height + 'px'}
        />
      </div>
    </div></Portal
  >
{/if}
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
    class={['group absolute top-0 bottom-0', { 'cursor-not-allowed': disabled, 'cursor-pointer': !disabled }]}
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
            <Icon data-icon-favorite icon={mdiHeart} size="24" class="text-white" />
          </div>
        {/if}

        {#if !!assetOwner}
          <div class="absolute bottom-1 end-2 max-w-[50%]">
            <p class="text-xs font-medium text-white drop-shadow-lg max-w-[100%] truncate">
              {assetOwner.name}
            </p>
          </div>
        {/if}

        {#if !authManager.isSharedLink && showArchiveIcon && asset.visibility === AssetVisibility.Archive}
          <div class={['absolute start-2', asset.isFavorite ? 'bottom-10' : 'bottom-2']}>
            <Icon data-icon-archive icon={mdiArchiveArrowDownOutline} size="24" class="text-white" />
          </div>
        {/if}

        {#if asset.isImage && asset.projectionType === ProjectionType.EQUIRECTANGULAR}
          <div class="absolute end-0 top-0 flex place-items-center gap-1 text-xs font-medium text-white">
            <span class="pe-2 pt-2">
              <Icon data-icon-equirectangular icon={mdiRotate360} size="24" />
            </span>
          </div>
        {/if}

        {#if asset.isImage && asset.duration && !asset.duration.includes('0:00:00.000')}
          <div class="absolute end-0 top-0 flex place-items-center gap-1 text-xs font-medium text-white">
            <span class="pe-2 pt-2">
              <Icon data-icon-playable icon={mdiFileGifBox} size="24" />
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
              <Icon data-icon-stack icon={mdiCameraBurst} size="24" />
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
      {:else if asset.isImage && asset.duration && !asset.duration.includes('0:00:00.000') && mouseOver}
        <!-- GIF -->
        <div class="absolute top-0 h-full w-full pointer-events-none">
          <div class="absolute h-full w-full bg-linear-to-b from-black/25 via-[transparent_25%]"></div>
          <ImageThumbnail
            class={imageClass}
            {brokenAssetClass}
            url={getAssetOriginalUrl({ id: asset.id, cacheKey: asset.thumbhash })}
            altText={$getAltText(asset)}
            widthStyle="{width}px"
            heightStyle="{height}px"
            curve={selected}
          />
          <div class="absolute end-0 top-0 flex place-items-center gap-1 text-xs font-medium text-white">
            <span class="pe-2 pt-2">
              <Icon data-icon-playable-pause icon={mdiMotionPauseOutline} size="24" />
            </span>
          </div>
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
          <Icon data-icon-select icon={mdiCheckCircle} size="24" class="text-zinc-800" />
        {:else if selected}
          <div class="rounded-full bg-[#D9DCEF] dark:bg-[#232932]">
            <Icon data-icon-select icon={mdiCheckCircle} size="24" class="text-primary" />
          </div>
        {:else}
          <Icon data-icon-select icon={mdiCheckCircle} size="24" class="text-white/80 hover:text-white" />
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
