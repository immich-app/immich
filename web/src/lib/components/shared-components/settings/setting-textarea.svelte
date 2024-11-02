<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';

  interface Props {
    value: string;
    label?: string;
    descriptionText?: string;
    required?: boolean;
    disabled?: boolean;
    isEdited?: boolean;
    desc?: import('svelte').Snippet;
  }

  let {
    value = $bindable(),
    label = '',
    descriptionText = '',
    required = false,
    disabled = false,
    isEdited = false,
    desc
  }: Props = $props();

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
        {$t('unsaved_change')}
      </div>
    {/if}
  </div>

  {#if descriptionText}
    <p class="immich-form-label pb-2 text-sm" id="{label}-desc">
      {descriptionText}
    </p>
  {:else}
    {@render desc?.()}
  {/if}

  <textarea
    class="immich-form-input w-full pb-2"
    aria-describedby={descriptionText ? `${label}-desc` : undefined}
    aria-labelledby="{label}-label"
    id={label}
    name={label}
    {required}
    {value}
    oninput={handleInput}
    {disabled}
  ></textarea>
</div>
