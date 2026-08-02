<script lang="ts">
  import { onMount } from 'svelte';
  import type { FilmSimulationBannerConfig } from '$lib/utils/film-simulation-banner';

  interface Props {
    config: FilmSimulationBannerConfig;
    title: string;
    displayLabel: string;
  }

  const horizontalDetentStart = 1008;
  const horizontalDetentStep = 31;
  const horizontalDetentCount = 27;
  const horizontalDetents = Array.from({ length: horizontalDetentCount });
  const verticalDetentStart = 80;
  const verticalDetentStep = 21;
  const verticalDetentCount = 25;
  const verticalDetents = Array.from({ length: verticalDetentCount });
  const parameterCenters = [1063, 1202, 1341, 1479, 1618, 1756];
  const parameterSeparators = [1133, 1272, 1410, 1549, 1687];

  let { config, title, displayLabel }: Props = $props();
  let bannerElement: SVGSVGElement;
  let detentHitArea: SVGRectElement;
  let isTrackingPointer = false;
  let scrollProgress = $state(0);
  let hoveredDetent = $state<number | null>(null);

  const counterValue = $derived(
    String(Math.round(config.counterStart + (config.counterEnd - config.counterStart) * scrollProgress)).padStart(
      2,
      '0',
    ),
  );
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
  const monogramLength = $derived(config.monogram.length === 1 ? 230 : config.monogram.length === 2 ? 350 : 430);

  const variantToken = $derived.by(() => {
    if (/\bYe\b|yellow/i.test(displayLabel)) {
      return 'Ye';
    }
    if (/\bR\b|red/i.test(displayLabel)) {
      return 'R';
    }
    if (/\bG\b|green/i.test(displayLabel)) {
      return 'G';
    }
    return config.id === 'monochrome' ? 'STD' : 'Ø';
  });

  const parameterBottom = (index: number) => {
    if (config.id === 'acros' && index === 2) {
      return variantToken;
    }
    if (config.id === 'monochrome' && index === 1) {
      return variantToken;
    }
    return config.parameters[index].bottom;
  };

  const textLength = (value: string, maximum = 104) => Math.min(maximum, Math.max(28, value.length * 23));

  const findScrollContainer = (element: Element) => {
    let parent = element.parentElement;
    while (parent) {
      if (/auto|scroll/.test(getComputedStyle(parent).overflowY)) {
        return parent;
      }
      parent = parent.parentElement;
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

  const handleHorizontalDetentMove = (event: PointerEvent) => {
    const bounds = (event.currentTarget as SVGRectElement).getBoundingClientRect();
    const progress = Math.max(0, Math.min(0.999, (event.clientX - bounds.left) / bounds.width));
    hoveredDetent = progress * (horizontalDetentCount - 1);
    if (!isTrackingPointer) {
      addEventListener('pointermove', handleWindowPointerMove, { passive: true });
      isTrackingPointer = true;
    }
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
  aria-labelledby={`${config.id}-title ${config.id}-description`}
  class="film-simulation-banner"
  style={`--panel:${config.panel};--primary:${config.primary};--secondary:${config.secondary};--paper:${config.paper};--ink:${config.ink}`}
  preserveAspectRatio="xMidYMid meet"
>
  <title id={`${config.id}-title`}>{title}</title>
  <desc id={`${config.id}-description`}>{config.description}</desc>

  <rect width="1983" height="793" fill="var(--panel)" />

  <!-- Official identity-inspired vector label -->
  <g class="identity-panel">
    {#if config.id === 'provia'}
      <rect width="980" height="793" fill="#282828" />
      <rect width="980" height="580" fill="#1925ab" />
      <rect width="300" height="218" fill="#f9f9f9" />
      <rect x="300" width="680" height="218" fill="#00bb16" />
      <rect y="580" width="980" height="13" fill="#faeb5c" />
      <text x="58" y="505" textLength="760" class="identity-serif paper-text">PROVIA</text>
      <text x="62" y="558" class="identity-micro paper-text">FUJICHROME 100F · COLOR REVERSAL</text>
    {:else if config.id === 'velvia'}
      <rect width="980" height="793" fill="#00bc16" />
      <rect y="220" width="980" height="385" fill="#f9f9f9" />
      <rect y="220" width="300" height="385" fill="#0064bc" />
      <text x="315" y="500" textLength="610" class="identity-heavy" fill="#282828">Velvia</text>
      <text x="50" y="176" class="identity-micro paper-text">FUJICHROME · RVP 135 · ISO 50/18°</text>
      <text x="50" y="680" class="identity-micro paper-text">DAYLIGHT · E-6 · PROFESSIONAL</text>
    {:else if config.id === 'astia'}
      <rect width="980" height="793" fill="#1925ac" />
      <rect width="980" height="218" fill="#00bc16" />
      <rect width="300" height="218" fill="#f9f9f9" />
      <rect x="300" width="12" height="218" fill="#e30012" />
      <rect y="218" width="980" height="382" fill="#a99158" />
      <rect y="600" width="980" height="28" fill="#282828" />
      <text x="170" y="500" textLength="690" class="identity-heavy" fill="#282828">ASTIA</text>
      <text x="55" y="680" class="identity-micro paper-text">FUJICHROME 100F · PROFESSIONAL · RAP</text>
    {:else if config.id === 'realaAce'}
      <rect width="980" height="793" fill="#00bc16" />
      <path d="M0 0H610L300 218H0Z" fill="#feffff" />
      <path d="M610 0H800L470 218H300Z" fill="#dfb800" />
      <path d="M800 0H980V218H470Z" fill="#000001" />
      <text x="155" y="485" textLength="650" class="identity-heavy identity-italic" fill="#dfb800" stroke="#000001">
        REALA
      </text>
      <text x="430" y="650" textLength="390" class="identity-heavy identity-italic paper-text">ACE</text>
      <text x="45" y="744" class="identity-micro" fill="#000001">ISO 100 · 4TH COLOR-SENSITIVE LAYER</text>
    {:else if config.id === 'classicNeg'}
      <rect width="980" height="793" fill="#00bd16" />
      <path d="M0 570H520L440 793H0Z" fill="#1f70ff" />
      <rect y="548" width="980" height="18" fill="#f7db30" />
      <rect x="650" y="548" width="110" height="18" fill="#f04721" />
      <text x="45" y="420" textLength="760" class="identity-serif" fill="#f7db30" stroke="#282206">CLASSIC</text>
      <text x="710" y="530" textLength="210" class="identity-condensed" fill="#f7db30" stroke="#282206"> Neg. </text>
      <text x="45" y="720" class="identity-micro paper-text">FUJICOLOR · SUPERIA · ISO 400 · C-41</text>
    {:else if config.id === 'nostalgicNeg'}
      <rect width="980" height="793" fill="#00bf16" />
      <rect width="300" height="218" fill="#f9f9f9" />
      <rect y="560" width="980" height="15" fill="#f9f9f9" />
      <rect y="575" width="980" height="40" fill="#fe0000" />
      <rect y="615" width="980" height="178" fill="#ffb900" />
      <text x="34" y="500" textLength="880" class="identity-condensed paper-text">NOSTALGIC Neg.</text>
    {:else if config.id === 'proNegHi'}
      <rect width="980" height="793" fill="#282828" />
      <rect width="980" height="218" fill="#00bc16" />
      <rect width="300" height="218" fill="#f9f9f9" />
      <rect x="300" width="12" height="218" fill="#e30012" />
      <rect x="590" y="218" width="390" height="382" fill="#a99158" />
      <rect y="600" width="980" height="12" fill="#9900da" />
      <text x="45" y="440" textLength="380" class="identity-serif" fill="#bea266">PRO</text>
      <text x="112" y="545" textLength="220" class="identity-condensed" fill="#bea266">Neg.</text>
      <text x="625" y="520" textLength="285" class="identity-heavy" fill="#282828">Hi</text>
      <text x="45" y="690" class="identity-micro paper-text">FUJICOLOR PRO 160 NH · 120 · CN-16</text>
    {:else if config.id === 'proNegStd'}
      <rect width="980" height="793" fill="#282828" />
      <rect width="980" height="218" fill="#00bc16" />
      <rect width="300" height="218" fill="#f9f9f9" />
      <rect x="300" width="12" height="218" fill="#de0918" />
      <rect x="590" y="218" width="390" height="382" fill="#a7a7a8" />
      <rect y="600" width="980" height="12" fill="#9c0d5a" />
      <text x="45" y="440" textLength="380" class="identity-serif paper-text">PRO</text>
      <text x="112" y="545" textLength="220" class="identity-condensed paper-text">Neg.</text>
      <text x="625" y="510" textLength="285" class="identity-serif" fill="#262626">Std</text>
      <text x="45" y="690" class="identity-micro paper-text">FUJICOLOR PRO 160 NS · STUDIO PORTRAIT</text>
    {:else if config.id === 'eterna'}
      <rect width="980" height="793" fill="#282828" />
      <rect y="72" width="980" height="16" fill="#e75514" />
      <rect y="580" width="980" height="22" fill="#e75514" />
      <rect y="602" width="980" height="191" fill="#b89a68" />
      <text x="80" y="480" textLength="780" class="identity-serif" fill="#b89a68">ETERNA</text>
      <text x="80" y="555" class="identity-micro" fill="#b89a68">MOTION PICTURE COLOR NEGATIVE · EI 500T</text>
    {:else if config.id === 'eternaBleachBypass'}
      <rect width="980" height="793" fill="#292827" />
      <rect y="72" width="980" height="16" fill="#ea4b12" />
      <rect y="218" width="980" height="20" fill="#c15a21" />
      <rect y="238" width="980" height="555" fill="#bac8ce" />
      <text x="45" y="205" textLength="700" class="identity-serif paper-text">ETERNA</text>
      <text x="345" y="465" textLength="520" class="identity-serif" fill="#292827">BLEACH</text>
      <text x="315" y="660" textLength="560" class="identity-serif" fill="#292827">BYPASS</text>
    {:else if config.id === 'acros'}
      <rect width="980" height="793" fill="#b7bab8" />
      <rect width="980" height="218" fill="#00b54a" />
      <rect width="390" height="218" fill="#f3f3ee" />
      <rect y="218" width="980" height="110" fill="#202321" />
      <text x="65" y="625" textLength="720" class="identity-heavy" fill="#202321">ACROS</text>
      <text x="785" y="420" textLength="145" class="identity-condensed" fill="#202321">100</text>
      <text x="50" y="290" class="identity-micro paper-text">FUJIFILM · NEOPAN · PROFESSIONAL</text>
      <circle
        cx="875"
        cy="115"
        r="52"
        fill={variantToken === 'Ø'
          ? '#f3f3ee'
          : variantToken === 'Ye'
            ? '#e7c229'
            : variantToken === 'R'
              ? '#c93b32'
              : '#139b50'}
      />
      <text x="875" y="135" text-anchor="middle" class="filter-token" fill="#202321">{variantToken}</text>
    {:else if config.id === 'monochrome'}
      <rect width="980" height="793" fill="#b2b2b3" />
      <rect width="980" height="218" fill="#00bc16" />
      <rect width="300" height="218" fill="#f9f9f9" />
      <text x="50" y="570" textLength="710" class="identity-heavy" fill="#282828">MONO</text>
      <text x="735" y="720" textLength="170" class="identity-condensed" fill="#282828">{variantToken}</text>
      <text x="50" y="660" class="identity-micro" fill="#6d6d6d">SMOOTH DIGITAL MONOCHROME</text>
    {:else if config.id === 'sepia'}
      <rect width="980" height="793" fill="#b9dd54" />
      <rect y="580" width="980" height="213" fill="#6a3906" />
      <text x="85" y="480" textLength="780" class="identity-heavy identity-italic" fill="#fde200" stroke="#1d1909">
        SEPIA
      </text>
      <text x="75" y="690" class="identity-micro" fill="#f0d19a">WARM TONE · TRADITIONAL PRINT PROCESS</text>
    {/if}
  </g>

  <!-- Shared interactive camera / film instrument panel -->
  <g class="instrument-panel">
    <text
      x="1270"
      y="425"
      text-anchor="middle"
      textLength={monogramLength}
      lengthAdjust="spacingAndGlyphs"
      class="monogram">{config.monogram}</text
    >

    <rect x="1565" y="176" width="233" height="267" rx="20" class="counter-outline" />
    <text x="1682" y="382" text-anchor="middle" textLength="150" lengthAdjust="spacingAndGlyphs" class="counter-number">
      {counterValue}
    </text>
    <path
      d="M1797 116L1835 143 1797 170Z"
      class="scroll-position-marker"
      style:transform={`translateY(${markerOffset}px)`}
    />

    <g class="scale-rule vertical-detents" aria-hidden="true" style:transform={`translateY(${verticalDetentOffset}px)`}>
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
      {#each config.scaleLabels as label, index (index)}
        <text x="1950" y={167 + index * 142} text-anchor="end">{label}</text>
      {/each}
    </g>

    <g class="parameter-strip">
      {#each config.parameters as parameter, index (index)}
        <g>
          <text
            x={parameterCenters[index]}
            y="566"
            text-anchor="middle"
            textLength={textLength(parameter.top, 92)}
            lengthAdjust="spacingAndGlyphs">{parameter.top}</text
          >
          <text
            x={parameterCenters[index]}
            y="616"
            text-anchor="middle"
            textLength={textLength(parameterBottom(index))}
            lengthAdjust="spacingAndGlyphs">{parameterBottom(index)}</text
          >
          <path d={`M${parameterCenters[index] - 50} 634H${parameterCenters[index] + 50}`} />
        </g>
        {#if index < parameterSeparators.length}
          <path d={`M${parameterSeparators[index]} 520V640`} />
        {/if}
      {/each}
    </g>

    <g class="bottom-ticks" aria-hidden="true">
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
  </g>

  <rect x="1.5" y="1.5" width="1980" height="790" class="outer-border" />
</svg>

<style>
  .film-simulation-banner {
    display: block;
    width: 100%;
    height: auto;
    overflow: hidden;
    contain: layout paint style;
  }

  .identity-serif,
  .identity-heavy,
  .identity-condensed,
  .identity-micro,
  .filter-token {
    paint-order: stroke fill;
  }

  .identity-serif {
    font-family: Didot, 'Bodoni 72', Georgia, serif;
    font-size: 210px;
    font-weight: 700;
  }

  .identity-heavy {
    font-family: 'GoogleSansCode', 'Arial Black', sans-serif;
    font-size: 205px;
    font-weight: 850;
  }

  .identity-condensed {
    font-family: 'GoogleSansCode', 'Arial Narrow', sans-serif;
    font-size: 142px;
    font-weight: 650;
  }

  .identity-italic {
    font-style: italic;
  }

  .identity-micro {
    font-family: 'GoogleSansCode', monospace;
    font-size: 34px;
    font-weight: 650;
    letter-spacing: 3px;
  }

  .paper-text {
    fill: var(--paper);
  }

  .filter-token {
    font-family: 'GoogleSansCode', monospace;
    font-size: 52px;
    font-weight: 750;
  }

  .monogram {
    fill: var(--paper);
    font-family: 'GoogleSansCode', 'Arial Black', sans-serif;
    font-size: 245px;
    font-weight: 850;
    letter-spacing: -12px;
  }

  .counter-outline {
    fill: none;
    stroke: var(--primary);
    stroke-width: 10;
  }

  .counter-number,
  .scale-numbers,
  .parameter-strip text {
    fill: var(--primary);
    font-family: 'GoogleSansCode', monospace;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }

  .counter-number {
    font-size: 188px;
    font-weight: 750;
  }

  .scroll-position-marker {
    fill: var(--paper);
  }

  .scale-rule,
  .bottom-ticks,
  .parameter-strip {
    fill: none;
    stroke: var(--primary);
    stroke-width: 6;
  }

  .scale-numbers {
    font-size: 59px;
  }

  .parameter-strip text {
    stroke: none;
    font-size: 45px;
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
    stroke: var(--paper);
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--secondary) 58%, transparent));
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
    stroke: color-mix(in srgb, var(--paper) 45%, transparent);
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
