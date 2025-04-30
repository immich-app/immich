<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Slider from '$lib/components/elements/slider.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { t } from 'svelte-i18n';
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    checked?: boolean;
    disabled?: boolean;
    isEdited?: boolean;
    onToggle?: (isChecked: boolean) => void;
    children?: Snippet;
  }

  let {
    title,
    subtitle = '',
    checked = $bindable(false),
    disabled = false,
    isEdited = false,
    onToggle = () => {},
    children,
  }: Props = $props();

  let id: string = generateId();

  let sliderId = $derived(`${id}-slider`);
  let subtitleId = $derived(subtitle ? `${id}-subtitle` : undefined);
</script>

<div class="flex place-items-center justify-between">
  <div class="me-2">
    <div class="flex h-[26px] place-items-center gap-1">
      <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for={sliderId}>
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

    {#if subtitle}
      <p id={subtitleId} class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
    {/if}
    {@render children?.()}
  </div>

  <Slider id={sliderId} bind:checked {disabled} {onToggle} ariaDescribedBy={subtitleId} />
</div>
