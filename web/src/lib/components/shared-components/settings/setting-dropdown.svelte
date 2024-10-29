<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Dropdown, { type RenderedOption } from '$lib/components/elements/dropdown.svelte';
  import { t } from 'svelte-i18n';

  export let title: string;
  export let subtitle = '';
  export let options: RenderedOption[];
  export let selectedOption: RenderedOption;
  export let isEdited = false;

  export let onToggle: (option: RenderedOption) => void;
</script>

<div class="flex place-items-center justify-between">
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
    <slot />
  </div>
  <div class="w-fit">
    <Dropdown
      {options}
      hideTextOnSmallScreen={false}
      bind:selectedOption
      render={(option) => {
        return {
          title: option.title,
          icon: option.icon,
        };
      }}
      onSelect={onToggle}
    />
  </div>
</div>
