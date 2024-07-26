<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import type { ResetOptions } from '$lib/utils/dipatch';
  import { t } from 'svelte-i18n';

  export let showResetToDefault = true;
  export let disabled = false;
  export let onReset: (options: ResetOptions) => void;
  export let onSave: () => void;
</script>

<div class="mt-8 flex justify-between gap-2">
  <div class="left">
    {#if showResetToDefault}
      <button
        type="button"
        on:click={() => onReset({ default: true })}
        class="bg-none text-sm font-medium text-immich-primary hover:text-immich-primary/75 dark:text-immich-dark-primary hover:dark:text-immich-dark-primary/75"
      >
        {$t('reset_to_default')}
      </button>
    {/if}
  </div>

  <div class="right">
    <Button {disabled} size="sm" color="gray" on:click={() => onReset({ default: false })}>{$t('reset')}</Button>
    <Button type="submit" {disabled} size="sm" on:click={() => onSave()}>{$t('save')}</Button>
  </div>
</div>
