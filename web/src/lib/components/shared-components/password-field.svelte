<script lang="ts">
  import { mdiEyeOffOutline, mdiEyeOutline } from '@mdi/js';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Icon from '../elements/icon.svelte';

  interface $$Props extends HTMLInputAttributes {
    password: string;
    autocomplete: string;
    required?: boolean;
    onInput?: (value: string) => void;
  }

  export let password: $$Props['password'];
  export let required = true;
  export let onInput: $$Props['onInput'] = undefined;

  let showPassword = false;
</script>

<div class="relative w-full">
  <input
    {...$$restProps}
    class="immich-form-input w-full !pr-12"
    type={showPassword ? 'text' : 'password'}
    {required}
    value={password}
    on:input={(e) => {
      password = e.currentTarget.value;
      onInput?.(password);
    }}
  />

  {#if password.length > 0}
    <button
      type="button"
      tabindex="-1"
      class="absolute inset-y-0 end-0 px-4 text-gray-700 dark:text-gray-200"
      on:click={() => (showPassword = !showPassword)}
      title={showPassword ? 'Hide password' : 'Show password'}
    >
      <Icon path={showPassword ? mdiEyeOffOutline : mdiEyeOutline} size="1.25em" />
    </button>
  {/if}
</div>

<style>
  input::-ms-reveal {
    display: none;
  }
</style>
