<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let value: string[];
  export let options: { value: string; text: string }[];
  export let label = '';
  export let desc = '';
  export let name = '';
  export let isEdited = false;
  export let disabled = false;

  function handleCheckboxChange(option: string) {
    value = value.includes(option) ? value.filter((item) => item !== option) : [...value, option];
  }
</script>

<div class="mb-4 w-full">
  <div class={`flex h-[26px] place-items-center gap-1`}>
    <label class={`immich-form-label text-sm`} for="{name}-select">{label}</label>

    {#if isEdited}
      <div
        transition:fly={{ x: 10, duration: 200, easing: quintOut }}
        class="rounded-full bg-orange-100 px-2 text-[10px] text-orange-900"
      >
        Unsaved change
      </div>
    {/if}
  </div>

  {#if desc}
    <p class="immich-form-label pb-2 text-sm" id="{name}-desc">
      {desc}
    </p>
  {/if}

  {#each options as option}
    <label class="flex items-center mb-2">
      <input
        type="checkbox"
        class="form-checkbox h-5 w-5 color"
        {disabled}
        checked={value.includes(option.value)}
        on:change={() => handleCheckboxChange(option.value)}
      />
      <span class="ml-2 text-sm text-gray-500 dark:text-gray-300 pt-1">{option.text}</span>
    </label>
  {/each}
</div>
