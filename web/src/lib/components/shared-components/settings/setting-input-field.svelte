<script lang="ts" context="module">
  export enum SettingInputFieldType {
    EMAIL = 'email',
    TEXT = 'text',
    NUMBER = 'number',
    PASSWORD = 'password',
  }
</script>

<script lang="ts">
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import PasswordField from '../password-field.svelte';

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
  export let passwordAutocomplete: string = 'current-password';

  const validateInput = () => {
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
        Unsaved change
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
    <input
      class="immich-form-input w-full pb-2"
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
      on:input={(e) => (value = e.currentTarget.value)}
      on:blur={validateInput}
      {disabled}
      {title}
    />
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
