<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  export let value: string;
  export let label = '';
  export let desc = '';
  export let required = false;
  export let disabled = false;
  export let isEdited = false;

  const handleInput = (e: Event) => {
    value = (e.target as HTMLInputElement).value;
  };
</script>

<div class="mb-4 w-full">
  <div class={`flex h-[26px] place-items-center gap-1`}>
    <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for={label}>{label}</label>
    {#if required}
      <div class="text-red-400">*</div>
    {/if}

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
    <p class="immich-form-label pb-2 text-sm" id="{label}-desc">
      {desc}
    </p>
  {:else}
    <slot name="desc" />
  {/if}

  <textarea
    class="immich-form-input w-full pb-2"
    aria-describedby={desc ? `${label}-desc` : undefined}
    aria-labelledby="{label}-label"
    id={label}
    name={label}
    {required}
    {value}
    on:input={handleInput}
    {disabled}
  />
</div>
