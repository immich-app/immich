<script lang="ts">
  import { Button, type Color } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '../full-screen-modal.svelte';

  interface Props {
    title?: string;
    prompt?: string;
    confirmText?: string;
    confirmColor?: Color;
    cancelText?: string;
    cancelColor?: Color;
    hideCancelButton?: boolean;
    disabled?: boolean;
    width?: 'wide' | 'narrow';
    onClose: (confirmed: boolean) => void;
    promptSnippet?: Snippet;
  }

  let {
    title = $t('confirm'),
    prompt = $t('are_you_sure_to_do_this'),
    confirmText = $t('confirm'),
    confirmColor = 'danger',
    cancelText = $t('cancel'),
    cancelColor = 'secondary',
    hideCancelButton = false,
    disabled = false,
    width = 'narrow',
    onClose,
    promptSnippet,
  }: Props = $props();

  const handleConfirm = () => {
    onClose(true);
  };
</script>

<FullScreenModal {title} onClose={() => onClose(false)} {width}>
  <div class="text-md py-5 text-center">
    {#if promptSnippet}{@render promptSnippet()}{:else}
      <p>{prompt}</p>
    {/if}
  </div>

  {#snippet stickyBottom()}
    {#if !hideCancelButton}
      <Button shape="round" color={cancelColor} fullWidth onclick={() => onClose(false)}>
        {cancelText}
      </Button>
    {/if}
    <Button shape="round" color={confirmColor} fullWidth onclick={handleConfirm} {disabled}>
      {confirmText}
    </Button>
  {/snippet}
</FullScreenModal>
