<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onShowDetail: () => void;
  }

  let { onShowDetail }: Props = $props();
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'i' }, onShortcut: onShowDetail }} />

<CircleIconButton color="opaque" icon={mdiInformationOutline} onclick={onShowDetail} title={$t('info')} />
