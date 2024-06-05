<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Slider from '$lib/components/elements/slider.svelte';
  import { generateId } from '$lib/utils/generate-id';

  export let title: string;
  export let subtitle = '';
  export let checked = false;
  export let disabled = false;
  export let isEdited = false;

  let id: string = generateId();

  $: sliderId = `${id}-slider`;
  $: subtitleId = subtitle ? `${id}-subtitle` : undefined;

  const dispatch = createEventDispatcher<{ toggle: boolean }>();
  const onToggle = (isChecked: boolean) => dispatch('toggle', isChecked);
</script>

<div class="flex place-items-center justify-between">
  <div class="mr-2">
    <div class="flex h-[26px] place-items-center gap-1">
      <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for={sliderId}>
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

    {#if subtitle}
      <p id={subtitleId} class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
    {/if}
    <slot />
  </div>

  <Slider
    id={sliderId}
    bind:checked
    {disabled}
    on:toggle={({ detail }) => onToggle(detail)}
    ariaDescribedBy={subtitleId}
  />
</div>
