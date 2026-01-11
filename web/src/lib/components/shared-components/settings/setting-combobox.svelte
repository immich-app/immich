<script lang="ts">
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { Label, Text } from '@immich/ui';
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

<div>
  <div class="flex h-6.5 place-items-center gap-1">
    <Label>{title}</Label>
    {#if isEdited}
      <div
        transition:fly={{ x: 10, duration: 200, easing: quintOut }}
        class="rounded-full bg-orange-100 px-2 text-[10px] text-orange-900"
      >
        {$t('unsaved_change')}
      </div>
    {/if}
  </div>

  <Text size="small" color="muted">{subtitle}</Text>
  <div class="flex items-center mt-2 max-w-[300px]">
    <Combobox label={title} hideLabel={true} {selectedOption} {options} placeholder={comboboxPlaceholder} {onSelect} />
    {@render children?.()}
  </div>
</div>
