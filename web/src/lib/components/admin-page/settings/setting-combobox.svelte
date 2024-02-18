<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';

  export let title: string;
  export let comboxBoxPlaceholder: string;
  export let subtitle = '';
  export let textUnderComboxBox = '';
  export let isEdited = false;
  export let list: ComboBoxOption[];
  export let selectedOption: ComboBoxOption;

  const dispatch = createEventDispatcher<{
    select: ComboBoxOption;
  }>();
</script>

<div class="grid grid-cols-2">
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
  </div>
  <div class="w-full">
    <Combobox
      {selectedOption}
      options={list}
      placeholder={comboxBoxPlaceholder}
      on:select={({ detail }) => dispatch('select', detail)}
    />
    {#if textUnderComboxBox}
      <p class="mt-2">{textUnderComboxBox}</p>
    {/if}
  </div>
</div>
