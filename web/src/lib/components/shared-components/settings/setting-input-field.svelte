<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import type { FormEventHandler } from 'svelte/elements';
  import { fly } from 'svelte/transition';
  import PasswordField from '../password-field.svelte';
  import { t } from 'svelte-i18n';
  import { onMount, tick, type Snippet } from 'svelte';
  import { SettingInputFieldType } from '$lib/constants';

  interface Props {
    inputType: SettingInputFieldType;
    value: string | number;
    min?: number;
    max?: number;
    step?: string;
    label?: string;
    description?: string;
    title?: string;
    required?: boolean;
    disabled?: boolean;
    isEdited?: boolean;
    autofocus?: boolean;
    passwordAutocomplete?: AutoFill;
    descriptionSnippet?: Snippet;
    trailingSnippet?: Snippet;
  }

  let {
    inputType,
    value = $bindable(),
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    step = '1',
    label = '',
    description = '',
    title = '',
    required = false,
    disabled = false,
    isEdited = false,
    autofocus = false,
    passwordAutocomplete = 'current-password',
    descriptionSnippet,
    trailingSnippet,
  }: Props = $props();

  let input: HTMLInputElement | undefined = $state();

  const handleChange: FormEventHandler<HTMLInputElement> = (e) => {
    value = e.currentTarget.value;

    if (inputType === SettingInputFieldType.NUMBER) {
      let newValue = Number(value) || 0;
      if (newValue < min) {
        newValue = min;
      }
      if (newValue > max) {
        newValue = max;
      }
      value = newValue;
    }
  };

  onMount(() => {
    if (autofocus) {
      tick()
        .then(() => setTimeout(() => input?.focus(), 0))
        .catch((_) => {});
    }
  });
</script>

<div class="mb-4 w-full">
  <div class="flex place-items-center gap-1">
    <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm min-h-6" for={label}
      >{label}</label
    >
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
    <p class="immich-form-label pb-2 text-sm" id="{label}-desc">
      {description}
    </p>
  {:else}
    {@render descriptionSnippet?.()}
  {/if}

  {#if inputType !== SettingInputFieldType.PASSWORD}
    <div class="flex place-items-center place-content-center">
      {#if inputType === SettingInputFieldType.COLOR}
        <input
          bind:this={input}
          class="immich-form-input w-full pb-2 rounded-none me-1"
          aria-describedby={description ? `${label}-desc` : undefined}
          aria-labelledby="{label}-label"
          id={label}
          name={label}
          type="text"
          min={min.toString()}
          max={max.toString()}
          {step}
          {required}
          bind:value
          onchange={handleChange}
          {disabled}
          {title}
        />
      {/if}

      <input
        bind:this={input}
        class="immich-form-input w-full pb-2"
        class:color-picker={inputType === SettingInputFieldType.COLOR}
        aria-describedby={description ? `${label}-desc` : undefined}
        aria-labelledby="{label}-label"
        id={label}
        name={label}
        type={inputType}
        min={min.toString()}
        max={max.toString()}
        {step}
        {required}
        bind:value
        onchange={handleChange}
        {disabled}
        {title}
      />

      {@render trailingSnippet?.()}
    </div>
  {:else}
    <PasswordField
      aria-describedby={description ? `${label}-desc` : undefined}
      aria-labelledby="{label}-label"
      id={label}
      name={label}
      autocomplete={passwordAutocomplete}
      {required}
      password={value.toString()}
      onInput={(passwordValue) => (value = passwordValue)}
      {disabled}
      {title}
    />
  {/if}
</div>

<style>
  .color-picker {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 52px;
    height: 52px;
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    margin: 0;
  }

  .color-picker::-webkit-color-swatch {
    border-radius: 14px;
    border: none;
  }

  .color-picker::-moz-color-swatch {
    border-radius: 14px;
    border: none;
  }
</style>
