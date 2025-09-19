<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    title: string;
    comboboxPlaceholder: string;
    subtitle?: string;
    isEdited?: boolean;
    options: ComboBoxOption[];
    selectedOption: ComboBoxOption;
    onSelect: (combobox: ComboBoxOption | undefined) => void;
    children?: Snippet;
  }

  let {
    title,
    comboboxPlaceholder,
    subtitle = '',
    isEdited = false,
    options,
    selectedOption,
    onSelect,
    children,
  }: Props = $props();
</script>

<div class="grid grid-cols-2">
  <div>
    <div class="flex h-[26px] place-items-center gap-1">
      <label class="font-medium text-primary text-sm" for={title}>
        {title}
      </label>
      {#if isEdited}
        <div
          transition:fly={{ x: 10, duration: 200, easing: quintOut }}
          class="rounded-full bg-orange-100 px-2 text-[10px] text-orange-900"
        >
          {$t('unsaved_change')}
        </div>
      {/if}
    </div>

    <p class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
  </div>
  <div class="flex items-center">
    <Combobox label={title} hideLabel={true} {selectedOption} {options} placeholder={comboboxPlaceholder} {onSelect} />
    {@render children?.()}
  </div>
</div>
