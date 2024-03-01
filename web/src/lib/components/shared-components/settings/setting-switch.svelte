<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Slider from '$lib/components/elements/slider.svelte';

  export let title: string;
  export let subtitle = '';
  export let checked = false;
  export let disabled = false;
  export let isEdited = false;

  const dispatch = createEventDispatcher<{ toggle: boolean }>();
  const onToggle = (ischecked: boolean) => dispatch('toggle', ischecked);
</script>

<div class="flex place-items-center justify-between">
  <div>
    <div class="flex h-[26px] place-items-center gap-1">
      <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for={title}>
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

    <p class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
    <slot />
  </div>

  <Slider bind:checked {disabled} on:toggle={({ detail }) => onToggle(detail)} />
</div>
