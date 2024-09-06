<script lang="ts" context="module">
  export enum SettingInputFieldType {
    EMAIL = 'email',
    TEXT = 'text',
    NUMBER = 'number',
    PASSWORD = 'password',
    COLOR = 'color',
  }
</script>

<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import type { FormEventHandler } from 'svelte/elements';
  import { fly } from 'svelte/transition';
  import PasswordField from '../password-field.svelte';
  import { t } from 'svelte-i18n';
  import { onMount, tick } from 'svelte';

  export let inputType: SettingInputFieldType;
  export let value: string | number;
  export let min = Number.MIN_SAFE_INTEGER;
  export let max = Number.MAX_SAFE_INTEGER;
  export let step = '1';
  export let label = '';
  export let desc = '';
  export let title = '';
  export let required = false;
  export let disabled = false;
  export let isEdited = false;
  export let autofocus = false;
  export let passwordAutocomplete: string = 'current-password';

  let input: HTMLInputElement;

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
        .then(() => input?.focus())
        .catch((_) => {});
    }
  });
</script>

<div class="mb-4 w-full">
  <div class={`flex h-[26px] place-items-center gap-1`}>
    <label class="font-medium text-immich-primary dark:text-immich-dark-primary text-sm" for={label}>{label}</label>
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

  {#if desc}
    <p class="immich-form-label pb-2 text-sm" id="{label}-desc">
      {desc}
    </p>
  {:else}
    <slot name="desc" />
  {/if}

  {#if inputType !== SettingInputFieldType.PASSWORD}
    <div class="flex place-items-center place-content-center">
      {#if inputType === SettingInputFieldType.COLOR}
        <input
          bind:this={input}
          class="immich-form-input w-full pb-2 rounded-none mr-1"
          aria-describedby={desc ? `${label}-desc` : undefined}
          aria-labelledby="{label}-label"
          id={label}
          name={label}
          type="text"
          min={min.toString()}
          max={max.toString()}
          {step}
          {required}
          {value}
          on:change={handleChange}
          {disabled}
          {title}
        />
      {/if}

      <input
        bind:this={input}
        class="immich-form-input w-full pb-2"
        class:color-picker={inputType === SettingInputFieldType.COLOR}
        aria-describedby={desc ? `${label}-desc` : undefined}
        aria-labelledby="{label}-label"
        id={label}
        name={label}
        type={inputType}
        min={min.toString()}
        max={max.toString()}
        {step}
        {required}
        {value}
        on:change={handleChange}
        {disabled}
        {title}
      />
    </div>
  {:else}
    <PasswordField
      aria-describedby={desc ? `${label}-desc` : undefined}
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
