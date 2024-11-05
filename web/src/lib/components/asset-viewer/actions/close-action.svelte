<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<CircleIconButton color="opaque" icon={mdiArrowLeft} title={$t('go_back')} onclick={onClose} />
