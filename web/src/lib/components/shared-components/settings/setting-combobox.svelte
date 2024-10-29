<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';
  import { t } from 'svelte-i18n';

  export let title: string;
  export let comboboxPlaceholder: string;
  export let subtitle = '';
  export let isEdited = false;
  export let options: ComboBoxOption[];
  export let selectedOption: ComboBoxOption;
  export let onSelect: (combobox: ComboBoxOption | undefined) => void;
</script>

<div class="grid grid-cols-2">
  <div>
    <div class="flex h-[26px] place-items-center gap-1">
      <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for={title}>
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
    <slot />
  </div>
</div>
