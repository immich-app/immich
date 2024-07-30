<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let onShowDetail: () => void;
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'i' }, onShortcut: onShowDetail }} />

<CircleIconButton color="opaque" icon={mdiInformationOutline} on:click={onShowDetail} title={$t('info')} />
