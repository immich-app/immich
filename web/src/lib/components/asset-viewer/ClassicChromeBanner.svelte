<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    title?: string;
  }

  const horizontalDetentStart = 1008;
  const horizontalDetentStep = 31;
  const horizontalDetentCount = 27;
  const horizontalDetents = Array.from({ length: horizontalDetentCount });
  const verticalDetentStart = 80;
  const verticalDetentStep = 21;
  const verticalDetentCount = 25;
  const verticalDetents = Array.from({ length: verticalDetentCount });

  let { title = 'Classic Chrome' }: Props = $props();
  let bannerElement: SVGSVGElement;
  let detentHitArea: SVGRectElement;
  let isTrackingPointer = false;
  let scrollProgress = $state(0);
  let hoveredDetent = $state<number | null>(null);

  const framePosition = $derived(String(Math.round(36 * (1 - scrollProgress))).padStart(2, '0'));
  const markerOffset = $derived(scrollProgress * 419);
  const verticalDetentOffset = $derived((scrollProgress - 0.5) * 10);
  const horizontalDetentInfluence = (index: number) => {
    if (hoveredDetent === null) {
      return 0;
    }

    const distance = Math.abs(index - hoveredDetent);
    if (distance >= 5) {
      return 0;
    }

    const proximity = 1 - distance / 5;
    return proximity * proximity * (3 - 2 * proximity);
  };

  const horizontalDetentScale = (index: number) => 1 + horizontalDetentInfluence(index) * 0.9;
  const horizontalDetentOpacity = (index: number) => 0.72 + horizontalDetentInfluence(index) * 0.28;

  const findScrollContainer = (element: Element) => {
    let parent = element.parentElement;

    while (parent) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY)) {
        return parent;
      }
      parent = parent.parentElement;
    }
  };

  const handleHorizontalDetentMove = (event: PointerEvent) => {
    const bounds = (event.currentTarget as SVGRectElement).getBoundingClientRect();
    const progress = Math.max(0, Math.min(0.999, (event.clientX - bounds.left) / bounds.width));
    hoveredDetent = progress * (horizontalDetentCount - 1);

    if (!isTrackingPointer) {
      addEventListener('pointermove', handleWindowPointerMove, { passive: true });
      isTrackingPointer = true;
    }
  };

  const stopPointerTracking = () => {
    if (!isTrackingPointer) {
      return;
    }

    removeEventListener('pointermove', handleWindowPointerMove);
    isTrackingPointer = false;
  };

  const handleWindowPointerMove = (event: PointerEvent) => {
    if (hoveredDetent === null || detentHitArea.contains(event.target as Node)) {
      return;
    }

    hoveredDetent = null;
    stopPointerTracking();
  };

  onMount(() => {
    const scrollContainer = findScrollContainer(bannerElement);
    if (!scrollContainer) {
      return;
    }

    let animationFrame: number | undefined;
    const updateScrollPosition = () => {
      const maximumScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      scrollProgress = maximumScroll > 0 ? scrollContainer.scrollTop / maximumScroll : 0;
    };
    const handleScroll = () => {
      if (animationFrame !== undefined) {
        return;
      }

      animationFrame = requestAnimationFrame(() => {
        animationFrame = undefined;
        updateScrollPosition();
      });
    };

    updateScrollPosition();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      stopPointerTracking();
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
      }
    };
  });
</script>

<svg
  bind:this={bannerElement}
  viewBox="0 0 1983 793"
  role="img"
  aria-labelledby="classic-chrome-title classic-chrome-description"
  class="classic-chrome-banner"
  preserveAspectRatio="xMidYMid meet"
>
  <title id="classic-chrome-title">{title}</title>
  <desc id="classic-chrome-description">Classic Chrome film simulation camera parameter strip</desc>

  <defs>
    <linearGradient id="classic-chrome-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8a309" />
      <stop offset="0.52" stop-color="#f59d06" />
      <stop offset="1" stop-color="#f7a109" />
    </linearGradient>
    <linearGradient id="classic-chrome-cream" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff0c7" />
      <stop offset="1" stop-color="#ead59d" />
    </linearGradient>
  </defs>

  <rect width="1983" height="793" class="dark-fill" />
  <rect width="980" height="793" fill="url(#classic-chrome-gold)" />
  <rect x="410" width="159" height="793" class="red-fill" />

  <!-- Classic Chrome package label -->
  <path d="M0 139H29L134 367 29 598H0Z" class="dark-fill" />
  <path d="M980 139H955L827 367 955 598H980Z" class="dark-fill" />
  <path d="M28 144H958L828 367 958 592H28L132 367Z" class="label-outline" />
  <text x="201" y="382" textLength="590" lengthAdjust="spacingAndGlyphs" class="fuji-wordmark">FUJI</text>
  <text x="145" y="517" textLength="710" lengthAdjust="spacingAndGlyphs" class="simulation-name"> CLASSIC CHROME </text>

  <!-- Large CC identifier -->
  <text x="1065" y="464" textLength="410" lengthAdjust="spacingAndGlyphs" class="classic-chrome-monogram">CC</text>

  <!-- Frame counter -->
  <rect x="1565" y="176" width="233" height="267" rx="20" class="counter-outline" />
  <text x="1682" y="382" text-anchor="middle" textLength="150" lengthAdjust="spacingAndGlyphs" class="counter-number">
    {framePosition}
  </text>
  <path
    d="M1797 116L1835 143 1797 170Z"
    class="cream-fill scroll-position-marker"
    style:transform={`translateY(${markerOffset}px)`}
  />

  <!-- Vertical frame scale -->
  <g class="scale-rule vertical-detents" style:transform={`translateY(${verticalDetentOffset}px)`}>
    {#each verticalDetents as _, index (index)}
      <line
        x1={index % 7 === 0 ? 1828 : 1840}
        x2="1870"
        y1={verticalDetentStart + index * verticalDetentStep}
        y2={verticalDetentStart + index * verticalDetentStep}
      />
    {/each}
  </g>
  <g class="scale-numbers">
    <text x="1950" y="167" text-anchor="end">36</text>
    <text x="1950" y="309" text-anchor="end">24</text>
    <text x="1950" y="451" text-anchor="end">12</text>
    <text x="1950" y="586" text-anchor="end">0</text>
  </g>

  <!-- Camera parameter strip -->
  <g class="parameter-strip">
    <g>
      <text x="1063" y="589" text-anchor="middle" textLength="108" lengthAdjust="spacingAndGlyphs">SIM CC</text>
      <path d="M1013 634H1113" />
    </g>
    <path d="M1133 520V640" />
    <g>
      <text x="1202" y="589" text-anchor="middle" textLength="100" lengthAdjust="spacingAndGlyphs">DR100</text>
      <path d="M1152 634H1252" />
    </g>
    <path d="M1272 520V640" />
    <g>
      <text x="1341" y="567" text-anchor="middle" textLength="58" lengthAdjust="spacingAndGlyphs">WB</text>
      <text x="1341" y="617" text-anchor="middle" textLength="92" lengthAdjust="spacingAndGlyphs">AUTO</text>
      <path d="M1291 634H1391" />
    </g>
    <path d="M1410 520V640" />
    <g>
      <text x="1479" y="567" text-anchor="middle">H</text>
      <text x="1479" y="617" text-anchor="middle">0</text>
      <path d="M1429 634H1529" />
    </g>
    <path d="M1549 520V640" />
    <g>
      <text x="1618" y="567" text-anchor="middle">S</text>
      <text x="1618" y="617" text-anchor="middle" textLength="42" lengthAdjust="spacingAndGlyphs">-1</text>
      <path d="M1568 634H1668" />
    </g>
    <path d="M1687 520V640" />
    <g>
      <text x="1756" y="567" text-anchor="middle" textLength="72" lengthAdjust="spacingAndGlyphs">GRN</text>
      <text x="1756" y="617" text-anchor="middle">0</text>
      <path d="M1706 634H1806" />
    </g>
  </g>

  <!-- Bottom calibration ticks -->
  <g class="bottom-ticks">
    {#each horizontalDetents as _, index (index)}
      <line
        x1={horizontalDetentStart + index * horizontalDetentStep}
        x2={horizontalDetentStart + index * horizontalDetentStep}
        y1={index % 7 === 0 ? 687 : 693}
        y2={index % 7 === 0 ? 726 : 720}
        class:active={horizontalDetentInfluence(index) > 0.02}
        style:opacity={horizontalDetentOpacity(index)}
        style:transform={`scaleY(${horizontalDetentScale(index)})`}
      />
    {/each}
  </g>
  <rect
    bind:this={detentHitArea}
    x="992"
    y="670"
    width="838"
    height="73"
    role="presentation"
    class="horizontal-detent-hit-area"
    onpointermove={handleHorizontalDetentMove}
  />
  <rect x="1.5" y="1.5" width="1980" height="790" class="outer-border" />
</svg>

<style>
  .classic-chrome-banner {
    display: block;
    width: 100%;
    height: auto;
    overflow: hidden;
    contain: layout paint style;
  }

  .dark-fill {
    fill: #1c1b10;
  }

  .red-fill {
    fill: #f33d0b;
  }

  .cream-fill {
    fill: url(#classic-chrome-cream);
  }

  .label-outline {
    fill: none;
    stroke: #1b1b12;
    stroke-width: 7;
    stroke-linejoin: miter;
  }

  .fuji-wordmark {
    fill: url(#classic-chrome-cream);
    stroke: #191a12;
    stroke-width: 12;
    paint-order: stroke fill;
    font-family: 'GoogleSansCode', 'Arial Black', sans-serif;
    font-size: 211px;
    font-weight: 900;
    letter-spacing: 10px;
  }

  .classic-chrome-monogram {
    fill: url(#classic-chrome-cream);
    stroke: #191a12;
    stroke-width: 3;
    paint-order: stroke fill;
    font-family: Rockwell, 'Roboto Slab', 'Arial Black', sans-serif;
    font-size: 430px;
    font-weight: 900;
    letter-spacing: 15px;
  }

  .simulation-name {
    fill: #17170f;
    font-family: 'GoogleSansCode', 'Arial Narrow', sans-serif;
    font-size: 113px;
    font-weight: 500;
    letter-spacing: -2px;
  }

  .counter-outline {
    fill: none;
    stroke: #f2ae23;
    stroke-width: 10;
  }

  .counter-number {
    fill: #f2ae23;
    font-family: 'GoogleSansCode', monospace;
    font-size: 188px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .scale-rule,
  .bottom-ticks,
  .parameter-strip {
    fill: none;
    stroke: #edae29;
    stroke-width: 6;
  }

  .scale-numbers,
  .parameter-strip text {
    fill: #edae29;
    stroke: none;
    font-family: 'GoogleSansCode', monospace;
    font-weight: 650;
  }

  .scale-numbers {
    font-size: 59px;
  }

  .parameter-strip text {
    font-size: 47px;
    letter-spacing: -1px;
  }

  .bottom-ticks {
    stroke-width: 5;
  }

  .bottom-ticks line {
    transform-box: fill-box;
    transform-origin: center;
    transition:
      transform 130ms ease-out,
      opacity 100ms ease-out;
  }

  .bottom-ticks line.active {
    stroke: #ffe3a0;
    filter: drop-shadow(0 0 5px rgb(255 190 55 / 58%));
  }

  .vertical-detents,
  .scroll-position-marker {
    transition: transform 140ms ease-out;
    will-change: transform;
  }

  .horizontal-detent-hit-area {
    fill: transparent;
    cursor: default;
    pointer-events: all;
  }

  .outer-border {
    fill: none;
    stroke: rgb(255 232 175 / 48%);
    stroke-width: 3;
  }

  @media (prefers-reduced-motion: reduce) {
    .vertical-detents,
    .scroll-position-marker,
    .bottom-ticks line {
      transition: none;
    }
  }
</style>
