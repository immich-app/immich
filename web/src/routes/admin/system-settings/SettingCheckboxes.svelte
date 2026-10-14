<script lang="ts" generics="T extends string | number">
  import SettingSourceHint from '$lib/components/shared-components/settings/SettingSourceHint.svelte';
  import { systemConfigManager, type ConfigKey } from '$lib/managers/system-config-manager.svelte';
  import { Checkbox, Label } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';

  interface Props {
    value: T[];
    options: { value: T; text: string }[];
    label?: string;
    desc?: string;
    name?: string;
    isEdited?: boolean;
    key?: ConfigKey;
    disabled?: boolean;
    lockedOptions?: T[];
  }

  let {
    value = $bindable(),
    options,
    label = '',
    desc = '',
    name = '',
    isEdited = false,
    key,
    disabled = false,
    lockedOptions = [],
  }: Props = $props();

  function handleCheckboxChange(option: T) {
    value = value.includes(option) ? value.filter((item) => item !== option) : [...value, option];
  }

  const field = $derived(key ? systemConfigManager.getField(key) : undefined);
  const isDisabled = $derived(disabled || field?.isEditable === false);
</script>

<div class="mb-4 w-full">
  <div class="flex h-6.5 place-items-center gap-1">
    <label class="text-sm font-medium text-primary" for="{name}-select">
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
    <p class="pb-2 text-sm immich-form-label" id="{name}-desc">
      {desc}
    </p>
  {/if}
  <div class="flex flex-col gap-2">
    {#each options as option (option.value)}
      <div class="flex items-center gap-2">
        <Checkbox
          size="tiny"
          id="{option.value}-checkbox"
          checked={value.includes(option.value)}
          disabled={isDisabled || lockedOptions.includes(option.value)}
          onCheckedChange={() => handleCheckboxChange(option.value)}
        />
        <Label label={option.text} for="{option.value}-checkbox" size="small" />
      </div>
    {/each}
  </div>
  <SettingSourceHint {key} />
</div>
