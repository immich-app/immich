<script lang="ts">
  import Checkbox from '$lib/components/elements/checkbox.svelte';
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
  <div class="flex flex-col gap-2">
    {#each options as option}
      <Checkbox
        id="{option.value}-checkbox"
        label={option.text}
        checked={value.includes(option.value)}
        {disabled}
        labelClass="text-gray-500 dark:text-gray-300"
        on:change={() => handleCheckboxChange(option.value)}
      />
    {/each}
  </div>
</div>
