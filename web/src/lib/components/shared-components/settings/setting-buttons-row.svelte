<script lang="ts">
  import type { ResetOptions } from '$lib/utils/dipatch';
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    showResetToDefault?: boolean;
    disabled?: boolean;
    onReset: (options: ResetOptions) => void;
    onSave: () => void;
  }

  let { showResetToDefault = true, disabled = false, onReset, onSave }: Props = $props();
</script>

<div class="mt-8 flex justify-between gap-2">
  <div class="left">
    {#if showResetToDefault}
      <button
        type="button"
        onclick={() => onReset({ default: true })}
        class="bg-none text-sm font-medium text-immich-primary hover:text-immich-primary/75 dark:text-immich-dark-primary hover:dark:text-immich-dark-primary/75"
      >
        {$t('reset_to_default')}
      </button>
    {/if}
  </div>

  <div class="flex gap-1">
    <Button shape="round" {disabled} size="small" color="secondary" onclick={() => onReset({ default: false })}
      >{$t('reset')}</Button
    >
    <Button shape="round" type="submit" {disabled} size="small" onclick={() => onSave()}>{$t('save')}</Button>
  </div>
</div>
