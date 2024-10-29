<script lang="ts">
  import { copyToClipboard } from '$lib/utils';
  import { mdiKeyVariant } from '@mdi/js';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { t } from 'svelte-i18n';

  export let secret = '';
  export let onDone: () => void;
</script>

<FullScreenModal title={$t('api_key')} icon={mdiKeyVariant} onClose={onDone}>
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <p class="text-sm dark:text-immich-dark-fg">
      {$t('api_key_description')}
    </p>
  </div>

  <div class="my-4 flex flex-col gap-2">
    <!-- <label class="immich-form-label" for="secret">{ $t("api_key") }</label> -->
    <textarea class="immich-form-input" id="secret" name="secret" readonly={true} value={secret} />
  </div>

  <svelte:fragment slot="sticky-bottom">
    <Button on:click={() => copyToClipboard(secret)} fullwidth>{$t('copy_to_clipboard')}</Button>
    <Button on:click={onDone} fullwidth>{$t('done')}</Button>
  </svelte:fragment>
</FullScreenModal>
