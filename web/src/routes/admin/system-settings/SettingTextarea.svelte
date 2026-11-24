<script lang="ts">
  import SettingSourceHint from '#lib/components/shared-components/settings/SettingSourceHint.svelte';
  import { createAdminConfigField, type AdminConfigKey } from '#lib/queries/config-admin.query.ts';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    value: string;
    label?: string;
    description?: string;
    required?: boolean;
    disabled?: boolean;
    isEdited?: boolean;
    key?: AdminConfigKey;
    descriptionSnippet?: Snippet;
  }

  let {
    value = $bindable(),
    label = '',
    description = '',
    required = false,
    disabled = false,
    isEdited = false,
    key,
    descriptionSnippet,
  }: Props = $props();

  const handleInput = (e: Event) => {
    value = (e.target as HTMLInputElement).value;
  };

  const configField = createAdminConfigField(() => key);
  const isDisabled = $derived(disabled || configField.isLocked);
</script>

<div class="mb-4 w-full">
  <div class="flex h-6.5 place-items-center gap-1">
    <label class="text-sm font-medium text-primary" for={label}>{label}</label>
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
    <p class="pb-2 text-sm immich-form-label" id="{label}-desc">
      {description}
    </p>
  {:else}
    {@render descriptionSnippet?.()}
  {/if}

  <textarea
    class="immich-form-input w-full pb-2"
    aria-describedby={description ? `${label}-desc` : undefined}
    aria-labelledby="{label}-label"
    id={label}
    name={label}
    {required}
    {value}
    oninput={handleInput}
    disabled={isDisabled}></textarea>

  <SettingSourceHint field={configField.field} />
</div>
