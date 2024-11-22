<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import type { Snippet } from 'svelte';

  interface Props {
    value: string;
    label?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
    isEdited?: boolean;
    descriptionSnippet?: Snippet;
    onChange?: (color: string) => void;
  }

  let {
    value = $bindable(),
    label = '',
    description = '',
    required = false,
    disabled = false,
    isEdited = false,
    descriptionSnippet,
    onChange,
  }: Props = $props();

  const handleInput = (e: Event) => {
    let _value = (e.target as HTMLInputElement).value;
    onChange!(_value);
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
        {$t('unsaved_change')}
      </div>
    {/if}
  </div>

  {#if description}
    <p class="immich-form-label pb-2 text-sm" id="{label}-desc">
      {description}
    </p>
  {:else}
    {@render descriptionSnippet?.()}
  {/if}

  <input
    type="color"
    class="p-1 h-10 w-14 block bg-white border border-gray-200 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700"
    title="Choose your color"
    aria-describedby={description ? `${label}-desc` : undefined}
    aria-labelledby="{label}-label"
    id={label}
    name={label}
    {required}
    {value}
    oninput={handleInput}
    {disabled}
  />
</div>
