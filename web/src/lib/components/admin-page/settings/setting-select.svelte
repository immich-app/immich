<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let value: string;
  export let options: { value: string; text: string }[];
  export let label = '';
  export let desc = '';
  export let name = '';
  export let isEdited = false;

  const handleChange = (e: Event) => {
    value = (e.target as HTMLInputElement).value;
  };
</script>

<div class="w-full">
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
    <p class="immich-form-label pb-2 text-xs" id="{name}-desc">
      {desc}
    </p>
  {/if}

  <select
    class="immich-form-input w-full pb-2"
    aria-describedby={desc ? `${name}-desc` : undefined}
    {name}
    id="{name}-select"
    bind:value
    on:change={handleChange}
  >
    {#each options as option}
      <option value={option.value}>{option.text}</option>
    {/each}
  </select>
</div>
