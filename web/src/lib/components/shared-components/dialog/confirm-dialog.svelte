<script lang="ts">
  import FullScreenModal from '../full-screen-modal.svelte';
  import { t } from 'svelte-i18n';
  import type { Snippet } from 'svelte';
  import { Button, type Color } from '@immich/ui';

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
    onCancel: () => void;
    onConfirm: () => void;
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
    onCancel,
    onConfirm,
    promptSnippet,
  }: Props = $props();

  const handleConfirm = () => {
    onConfirm();
  };
</script>

<FullScreenModal {title} onClose={onCancel} {width}>
  <div class="text-md py-5 text-center">
    {#if promptSnippet}{@render promptSnippet()}{:else}
      <p>{prompt}</p>
    {/if}
  </div>

  {#snippet stickyBottom()}
    {#if !hideCancelButton}
      <Button shape="round" color={cancelColor} fullWidth onclick={onCancel}>
        {cancelText}
      </Button>
    {/if}
    <Button shape="round" color={confirmColor} fullWidth onclick={handleConfirm} {disabled}>
      {confirmText}
    </Button>
  {/snippet}
</FullScreenModal>
