<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/Combobox.svelte';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    title: string;
    subtitle?: string;
    comboboxPlaceholder: string;
    disabled?: boolean;
    isEdited?: boolean;
    options: ComboBoxOption[];
    selectedOption: ComboBoxOption | undefined;
    allowCreate?: boolean;
    defaultFirstOption?: boolean;
    onSelect: (combobox: ComboBoxOption | undefined) => void;
  }

  let {
    title,
    subtitle = '',
    comboboxPlaceholder,
    disabled = false,
    isEdited = false,
    options,
    selectedOption,
    allowCreate = false,
    defaultFirstOption = false,
    onSelect,
  }: Props = $props();
</script>

<div class="mb-4 w-full">
  <div class="flex h-6.5 place-items-center gap-1">
    <label class="text-sm font-medium text-primary">{title}</label>
    {#if isEdited}
      <div
        transition:fly={{ x: 10, duration: 200, easing: quintOut }}
        class="rounded-full bg-orange-100 px-2 text-[10px] text-orange-900"
      >
        {$t('unsaved_change')}
      </div>
    {/if}
  </div>

  {#if subtitle}
    <p class="pb-2 text-sm immich-form-label">{subtitle}</p>
  {/if}

  <div class="max-w-full md:max-w-[38rem]">
    <Combobox
      label={title}
      hideLabel={true}
      {selectedOption}
      {options}
      placeholder={comboboxPlaceholder}
      {disabled}
      {allowCreate}
      {defaultFirstOption}
      {onSelect}
    />
  </div>
</div>