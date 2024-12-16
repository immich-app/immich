<script lang="ts">
  import FullScreenModal from '../full-screen-modal.svelte';
  import Button from '../../elements/buttons/button.svelte';
  import type { Color } from '$lib/components/elements/buttons/button.svelte';
  import { t } from 'svelte-i18n';
  import type { Snippet } from 'svelte';

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
    confirmColor = 'red',
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
      <Button color={cancelColor} fullwidth onclick={onCancel}>
        {cancelText}
      </Button>
    {/if}
    <Button color={confirmColor} fullwidth onclick={handleConfirm} {disabled}>
      {confirmText}
    </Button>
  {/snippet}
</FullScreenModal>
