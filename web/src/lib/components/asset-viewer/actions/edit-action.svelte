<script lang="ts">
  import { IconButton } from '@immich/ui';
  import { mdiPencil } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onAction: () => void;
  }

  let { onAction }: Props = $props();
</script>

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={mdiPencil}
  aria-label={$t('editor')}
  onclick={() => onAction()}
/>
