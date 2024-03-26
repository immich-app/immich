<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  export let title = 'Free';
  export let type = false; // false = range from 0 to 100, true = range from 0 to 200 with default value of 100
  export let value = 0;

  let dispatch = createEventDispatcher();
  let progressBar: HTMLDivElement;

  let rangeValue = 0;

  $: type ? (rangeValue = (value / 2) * 100) : (rangeValue = value * 100);

  $: value, renderProgress();

  onMount(() => {
    renderProgress();
  });

  const renderProgress = () => {
    if (!progressBar) {
      return;
    }

    const progress = rangeValue;
    type ? (value = (progress * 2) / 100) : (value = Number(progress) / 100);

    const progressPercent = (progress / 100) * 100;
    let progressColor;

    if (type) {
      progress <= 50
        ? (progressColor = `linear-gradient(90deg, #373737 ${progressPercent}%, #adcbfa ${progressPercent}%, #adcbfa 50%,#373737 50%)`)
        : (progressColor = `linear-gradient(90deg, #373737 50%, #adcbfa 50%, #adcbfa ${progressPercent}%, #373737 ${progressPercent}%)`);
    } else {
      progressColor = `linear-gradient(90deg, #adcbfa ${progressPercent}%,#373737 ${progressPercent}%)`;
    }
    progressBar.style.background = '#373737';
    progressBar.style.background = progressColor;
    dispatch('update', value);
  };
</script>

<div class="flex w-full text-white">
  <button
    class="{(type && value != 1) || (!type && value != 0)
      ? 'active-edit'
      : ''} bg-immich-gray/10 hover:bg-immich-gray/20 mr-3 rounded-full p-4 text-2xl"
    on:click={() => {
      if (type) {
        value = 1;
        rangeValue = 50;
      } else {
        value = 0;
        rangeValue = 0;
      }
      renderProgress();
      dispatch('save');
    }}
  >
    <slot />
  </button>
  <div class="relative grid w-full">
    <span>{title}</span>
    <input bind:value={rangeValue} type="range" on:input={renderProgress} on:change={() => dispatch('save')} />
    <div
      bind:this={progressBar}
      class="bg-immich-gray/10 progress-bar pointer-events-none absolute bottom-[22px] h-[3px] w-full rounded-full"
    />
  </div>
</div>

<style>
  .active-edit {
    background-color: #adcbfa;
    color: rgb(33, 33, 33);
  }
  .active-edit:hover {
    background-color: #adcbfa;
  }

  input[type='range'] {
    font-size: 1.5rem;
  }

  input[type='range'] {
    color: #adcbfa;
    --thumb-height: 12px;
    --track-height: -1px;
    --track-color: rgba(246, 246, 244, 0);
    --brightness-hover: 100%;
    --brightness-down: 100%;
    --clip-edges: 0.125em;
  }
  /* === range commons === */
  input[type='range'] {
    position: relative;
    background: #fff0;
    overflow: hidden;
  }

  input[type='range']:active {
    cursor: grabbing;
  }

  input[type='range']:disabled {
    filter: grayscale(1);
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* === WebKit specific styles === */
  input[type='range'],
  input[type='range']::-webkit-slider-runnable-track,
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    transition: all ease 100ms;
    height: var(--thumb-height);
  }

  input[type='range']::-webkit-slider-runnable-track,
  input[type='range']::-webkit-slider-thumb {
    position: relative;
  }

  input[type='range']::-webkit-slider-thumb {
    --thumb-radius: calc((var(--thumb-height) * 0.5) - 1px);
    --clip-top: calc((var(--thumb-height) - var(--track-height)) * 0.5 - 0.5px);
    --clip-bottom: calc(var(--thumb-height) - var(--clip-top));
    --clip-further: calc(100% + 1px);
    --box-fill: calc(-100vmax - var(--thumb-width, var(--thumb-height))) 0 0 100vmax currentColor;

    width: var(--thumb-width, var(--thumb-height));
    background: linear-gradient(currentColor 0 0) scroll no-repeat left center / 50% calc(var(--track-height) + 1px);
    background-color: currentColor;
    box-shadow: var(--box-fill);
    border-radius: var(--thumb-width, var(--thumb-height));

    filter: brightness(100%);
    clip-path: polygon(
      100% -1px,
      var(--clip-edges) -1px,
      0 var(--clip-top),
      -100vmax var(--clip-top),
      -100vmax var(--clip-bottom),
      0 var(--clip-bottom),
      var(--clip-edges) 100%,
      var(--clip-further) var(--clip-further)
    );
  }

  input[type='range']:hover::-webkit-slider-thumb {
    filter: brightness(var(--brightness-hover));
    cursor: grab;
  }

  input[type='range']:active::-webkit-slider-thumb {
    filter: brightness(var(--brightness-down));
    cursor: grabbing;
  }

  input[type='range']::-webkit-slider-runnable-track {
    background: linear-gradient(var(--track-color) 0 0) scroll no-repeat center / 100% calc(var(--track-height) + 1px);
  }

  input[type='range']:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
  }

  /* === Firefox specific styles === */
  input[type='range'],
  input[type='range']::-moz-range-track,
  input[type='range']::-moz-range-thumb {
    appearance: none;
    transition: all ease 100ms;
    height: var(--thumb-height);
  }

  input[type='range']::-moz-range-track,
  input[type='range']::-moz-range-thumb,
  input[type='range']::-moz-range-progress {
    background: #fff0;
  }

  input[type='range']::-moz-range-thumb {
    background: currentColor;
    border: 0;
    width: var(--thumb-width, var(--thumb-height));
    border-radius: var(--thumb-width, var(--thumb-height));
    cursor: grab;
  }

  input[type='range']:active::-moz-range-thumb {
    cursor: grabbing;
  }

  input[type='range']::-moz-range-track {
    width: 100%;
    background: var(--track-color);
  }

  input[type='range']::-moz-range-progress {
    appearance: none;
    background: currentColor;
    transition-delay: 30ms;
  }

  input[type='range']::-moz-range-track,
  input[type='range']::-moz-range-progress {
    height: calc(var(--track-height) + 1px);
    border-radius: var(--track-height);
  }

  input[type='range']::-moz-range-thumb,
  input[type='range']::-moz-range-progress {
    filter: brightness(100%);
  }

  input[type='range']:hover::-moz-range-thumb,
  input[type='range']:hover::-moz-range-progress {
    filter: brightness(var(--brightness-hover));
  }

  input[type='range']:active::-moz-range-thumb,
  input[type='range']:active::-moz-range-progress {
    filter: brightness(var(--brightness-down));
  }

  input[type='range']:disabled::-moz-range-thumb {
    cursor: not-allowed;
  }
</style>
