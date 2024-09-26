<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiChevronDown } from '@mdi/js';

  export let value: string | number;
  export let options: { value: string | number; text: string }[];
  export let label = '';
  export let desc = '';
  export let name = '';
  export let isEdited = false;
  export let number = false;
  export let disabled = false;
  export let onSelect: (setting: string | number) => void = () => {};

  const handleChange = (e: Event) => {
    value = (e.target as HTMLInputElement).value;
    if (number) {
      value = Number.parseInt(value);
    }
    onSelect(value);
  };
</script>

<div class="mb-4 w-full">
  <div class={`flex h-[26px] place-items-center gap-1`}>
    <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for="{name}-select"
      >{label}</label
    >

    {#if isEdited}
      <div
        transition:fly={{ x: 10, duration: 200, easing: quintOut }}
        class="rounded-full bg-orange-100 px-2 text-[10px] text-orange-900"
      >
        {$t('unsaved_change')}
      </div>
    {/if}
  </div>

  {#if desc}
    <p class="immich-form-label pb-2 text-sm" id="{name}-desc">
      {desc}
    </p>
  {/if}

  <div class="grid">
    <Icon
      path={mdiChevronDown}
      size={'1.2em'}
      ariaHidden={true}
      class="pointer-events-none right-1 relative col-start-1 row-start-1 self-center justify-self-end {disabled
        ? 'text-immich-bg'
        : 'text-immich-fg dark:text-immich-bg'}"
    />
    <select
      class="immich-form-input w-full appearance-none row-start-1 col-start-1 !pr-6"
      {disabled}
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
</div>
