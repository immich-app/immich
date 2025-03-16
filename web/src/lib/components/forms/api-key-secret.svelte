<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { Button } from '@immich/ui';
  import { mdiKeyVariant } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';

  interface Props {
    secret?: string;
    onDone: () => void;
  }

  let { secret = '', onDone }: Props = $props();
</script>

<FullScreenModal title={$t('api_key')} icon={mdiKeyVariant} onClose={onDone}>
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <p class="text-sm dark:text-immich-dark-fg">
      {$t('api_key_description')}
    </p>
  </div>

  <div class="my-4 flex flex-col gap-2">
    <!-- <label class="immich-form-label" for="secret">{ $t("api_key") }</label> -->
    <textarea class="immich-form-input" id="secret" name="secret" readonly={true} value={secret}></textarea>
  </div>

  {#snippet stickyBottom()}
    <Button shape="round" onclick={() => copyToClipboard(secret)} fullWidth>{$t('copy_to_clipboard')}</Button>
    <Button shape="round" onclick={onDone} fullWidth>{$t('done')}</Button>
  {/snippet}
</FullScreenModal>
