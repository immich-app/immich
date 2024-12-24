<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import ServerPurchaseOptionCard from './server-purchase-option-card.svelte';
  import UserPurchaseOptionCard from './individual-purchase-option-card.svelte';
  import { activateProduct, getActivationKey } from '$lib/utils/license-utils';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { purchaseStore } from '$lib/stores/purchase.store';
  import { t } from 'svelte-i18n';

  interface Props {
    onActivate: () => void;
    showTitle?: boolean;
    showMessage?: boolean;
  }

  let { onActivate, showTitle = true, showMessage = true }: Props = $props();
  let productKey = $state('');
  let isLoading = $state(false);

  const activate = async () => {
    try {
      productKey = productKey.trim();
      isLoading = true;

      const activationKey = await getActivationKey(productKey);
      await activateProduct(productKey, activationKey);

      onActivate();
      purchaseStore.setPurchaseStatus(true);
    } catch (error) {
      handleError(error, $t('purchase_failed_activation'));
    } finally {
      isLoading = false;
    }
  };
</script>

<section class="p-4">
  <div>
    {#if showTitle}
      <h1 class="text-4xl font-bold text-immich-primary dark:text-immich-dark-primary tracking-wider">
        {$t('purchase_option_title')}
      </h1>
    {/if}

    {#if showMessage}
      <div class="mt-2 dark:text-immich-gray">
        <p>
          {$t('purchase_panel_info_1')}
        </p>
        <br />
        <p>
          {$t('purchase_panel_info_2')}
        </p>
        <div></div>
      </div>
    {/if}

    <div class="flex gap-6 mt-4 justify-between">
      <ServerPurchaseOptionCard />
      <UserPurchaseOptionCard />
    </div>

    <div class="mt-6">
      <p class="dark:text-immich-gray">{$t('purchase_input_suggestion')}</p>
      <form class="mt-2 flex gap-2" onsubmit={activate}>
        <input
          class="immich-form-input w-full"
          id="purchaseKey"
          type="text"
          bind:value={productKey}
          required
          placeholder="IMCL-0KEY-0CAN-00BE-FOUD-FROM-YOUR-EMAIL-INBX"
          disabled={isLoading}
        />
        <Button type="submit" rounded="lg"
          >{#if isLoading}
            <LoadingSpinner />
          {:else}
            {$t('purchase_button_activate')}
          {/if}</Button
        >
      </form>
    </div>
  </div>
</section>
