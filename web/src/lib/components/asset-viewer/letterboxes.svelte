<script lang="ts">
  import { SlideshowLook, SlideshowState } from '$lib/stores/slideshow.store';

  interface Props {
    transitionName?: string | null | undefined;
    slideshowState: SlideshowState;
    slideshowLook: SlideshowLook;
    hasThumbhash: boolean;
    scaledDimensions: {
      width: number;
      height: number;
    };
    container: {
      width: number;
      height: number;
    };
  }

  let { transitionName, slideshowState, slideshowLook, hasThumbhash, scaledDimensions, container }: Props = $props();

  const blurredSlideshow = $derived(
    slideshowState !== SlideshowState.None && slideshowLook === SlideshowLook.BlurredBackground && hasThumbhash,
  );

  const shouldShowLetterboxes = $derived(!!transitionName && transitionName !== 'hero' && !blurredSlideshow);

  const transitionLetterboxLeft = $derived(shouldShowLetterboxes ? 'letterbox-left' : null);
  const transitionLetterboxRight = $derived(shouldShowLetterboxes ? 'letterbox-right' : null);
  const transitionLetterboxTop = $derived(shouldShowLetterboxes ? 'letterbox-top' : null);
  const transitionLetterboxBottom = $derived(shouldShowLetterboxes ? 'letterbox-bottom' : null);

  // Letterbox regions (the empty space around the main box)
  const letterboxLeft = $derived.by(() => {
    const { width } = scaledDimensions;
    const leftOffset = (container.width - width) / 2;
    return {
      width: leftOffset + 'px',
      height: container.height + 'px',
      left: '0px',
      top: '0px',
    };
  });

  const letterboxRight = $derived.by(() => {
    const { width } = scaledDimensions;
    const leftOffset = (container.width - width) / 2;
    const rightOffset = leftOffset;
    return {
      width: rightOffset + 'px',
      height: container.height + 'px',
      left: container.width - rightOffset + 'px',
      top: '0px',
    };
  });

  const letterboxTop = $derived.by(() => {
    const { width, height } = scaledDimensions;
    const topOffset = (container.height - height) / 2;
    const leftOffset = (container.width - width) / 2;
    return {
      width: width + 'px',
      height: topOffset + 'px',
      left: leftOffset + 'px',
      top: '0px',
    };
  });

  const letterboxBottom = $derived.by(() => {
    const { width, height } = scaledDimensions;
    const topOffset = (container.height - height) / 2;
    const bottomOffset = topOffset;
    const leftOffset = (container.width - width) / 2;
    return {
      width: width + 'px',
      height: bottomOffset + 'px',
      left: leftOffset + 'px',
      top: container.height - bottomOffset + 'px',
    };
  });
</script>

<!-- Letterbox regions (empty space around image) -->
<div
  class="absolute"
  style:view-transition-name={transitionLetterboxLeft}
  style:left={letterboxLeft.left}
  style:top={letterboxLeft.top}
  style:width={letterboxLeft.width}
  style:height={letterboxLeft.height}
></div>
<div
  class="absolute"
  style:view-transition-name={transitionLetterboxRight}
  style:left={letterboxRight.left}
  style:top={letterboxRight.top}
  style:width={letterboxRight.width}
  style:height={letterboxRight.height}
></div>
<div
  class="absolute"
  style:view-transition-name={transitionLetterboxTop}
  style:left={letterboxTop.left}
  style:top={letterboxTop.top}
  style:width={letterboxTop.width}
  style:height={letterboxTop.height}
></div>
<div
  class="absolute"
  style:view-transition-name={transitionLetterboxBottom}
  style:left={letterboxBottom.left}
  style:top={letterboxBottom.top}
  style:width={letterboxBottom.width}
  style:height={letterboxBottom.height}
></div>
