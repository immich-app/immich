<script lang="ts">
  import Dropdown, { type RenderedOption } from '$lib/elements/Dropdown.svelte';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    title: string;
    subtitle?: string;
    options: RenderedOption[];
    selectedOption: RenderedOption;
    isEdited?: boolean;
    onToggle: (option: RenderedOption) => void;
    children?: Snippet;
  }

  let {
    title,
    subtitle = '',
    options,
    selectedOption = $bindable(),
    isEdited = false,
    onToggle,
    children,
  }: Props = $props();
</script>

<div class="flex place-items-center justify-between">
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
    {@render children?.()}
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
