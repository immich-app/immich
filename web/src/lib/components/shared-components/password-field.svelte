<script lang="ts">
  import { mdiEyeOffOutline, mdiEyeOutline } from '@mdi/js';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import Icon from '../elements/icon.svelte';
  import { t } from 'svelte-i18n';

  interface Props extends HTMLInputAttributes {
    password: string;
    autocomplete: AutoFill;
    required?: boolean;
    onInput?: (value: string) => void;
  }

  let { password = $bindable(), required = true, onInput = undefined, ...rest }: Props = $props();

  let showPassword = $state(false);
</script>

<div class="relative w-full">
  <input
    {...rest}
    class="immich-form-input w-full !pe-12"
    type={showPassword ? 'text' : 'password'}
    {required}
    value={password}
    oninput={(e) => {
      password = e.currentTarget.value;
      onInput?.(password);
    }}
  />

  {#if password.length > 0}
    <button
      type="button"
      tabindex="-1"
      class="absolute inset-y-0 end-0 px-4 text-gray-700 dark:text-gray-200"
      onclick={() => (showPassword = !showPassword)}
      title={showPassword ? $t('hide_password') : $t('show_password')}
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
