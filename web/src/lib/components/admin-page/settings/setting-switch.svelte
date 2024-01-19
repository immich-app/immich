<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Slider from '$lib/components/elements/slider.svelte';
  import { elementId } from '@api';

  export let title: string;
  export let subtitle = '';
  export let checked = false;
  export let disabled = false;
  export let isEdited = false;

  let sliderId = elementId();
  let labelId = elementId();
  let subtitleId = elementId();

  const dispatch = createEventDispatcher<{ toggle: boolean }>();
</script>

<div class="flex place-items-center justify-between">
  <div>
    <div class="flex h-[26px] place-items-center gap-1">
      <label id={labelId} for={sliderId} class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm">
        {title}
      </label>
      {#if isEdited}
        <div
          transition:fly={{ x: 10, duration: 200, easing: quintOut }}
          class="rounded-full bg-orange-100 px-2 text-[10px] text-orange-900"
        >
          Unsaved change
        </div>
      {/if}
    </div>
    <p id={subtitleId} class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
  </div>
  <Slider
    id={sliderId}
    ariaLabelledBy={labelId}
    ariaDescribedBy={subtitleId}
    bind:checked
    {disabled}
    on:toggle={() => dispatch('toggle', checked)}
  />
</div>
