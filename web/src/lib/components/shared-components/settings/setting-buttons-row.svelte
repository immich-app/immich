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
      <Button variant="ghost" shape="round" size="small" onclick={() => onReset({ default: true })}
        >{$t('reset_to_default')}</Button
      >
    {/if}
  </div>

  <div class="flex gap-1">
    <Button shape="round" {disabled} size="small" color="secondary" onclick={() => onReset({ default: false })}
      >{$t('reset')}</Button
    >
    <Button shape="round" type="submit" {disabled} size="small" onclick={() => onSave()}>{$t('save')}</Button>
  </div>
</div>
