<script lang="ts">
  import { Checkbox, Label } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    value: string[];
    options: { value: string; text: string }[];
    label?: string;
    desc?: string;
    name?: string;
    isEdited?: boolean;
    disabled?: boolean;
  }

  let {
    value = $bindable(),
    options,
    label = '',
    desc = '',
    name = '',
    isEdited = false,
    disabled = false,
  }: Props = $props();

  function handleCheckboxChange(option: string) {
    value = value.includes(option) ? value.filter((item) => item !== option) : [...value, option];
  }
</script>

<div class="mb-4 w-full">
  <div class="flex h-[26px] place-items-center gap-1">
    <label class="font-medium text-primary text-sm" for="{name}-select">
      {label}
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

  {#if desc}
    <p class="immich-form-label pb-2 text-sm" id="{name}-desc">
      {desc}
    </p>
  {/if}
  <div class="flex flex-col gap-2">
    {#each options as option (option.value)}
      <div class="flex gap-2 items-center">
        <Checkbox
          size="tiny"
          id="{option.value}-checkbox"
          checked={value.includes(option.value)}
          {disabled}
          onCheckedChange={() => handleCheckboxChange(option.value)}
        />
        <Label label={option.text} for="{option.value}-checkbox" />
      </div>
    {/each}
  </div>
</div>
