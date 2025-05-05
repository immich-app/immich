<script lang="ts">
  import { t } from 'svelte-i18n';
  import FullScreenModal from './full-screen-modal.svelte';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<FullScreenModal title={$t('deduplication_info')} width="auto" {onClose}>
  <div class="text-sm dark:text-white">
    <p>{$t('deduplication_info_description')}</p>
    <ol class="ms-8 mt-2" style="list-style: decimal">
      <li>{$t('deduplication_criteria_1')}</li>
      <li>{$t('deduplication_criteria_2')}</li>
    </ol>
  </div>
</FullScreenModal>
