<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { ImmichProduct } from '$lib/constants';
  import { getLicenseLink as getProductLink } from '$lib/utils/license-utils';
  import { mdiAccount, mdiCheckCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<!-- Individual Purchase Option -->
<div class="border border-gray-300 dark:border-gray-800 w-[375px] p-8 rounded-3xl bg-gray-100 dark:bg-gray-900">
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <Icon path={mdiAccount} size="56" />
    <p class="font-semibold text-lg mt-1">{$t('purchase_individual_title')}</p>
  </div>

  <div class="mt-4 dark:text-immich-gray">
    <p class="text-6xl font-bold">$25</p>
    <p>{$t('purchase_per_user')}</p>
  </div>

  <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
    <div class="mt-6 flex flex-col gap-1">
      <div class="grid grid-cols-[36px_auto]">
        <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('purchase_individual_description_1')}</p>
      </div>

      <div class="grid grid-cols-[36px_auto]">
        <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('purchase_lifetime_description')}</p>
      </div>

      <div class="grid grid-cols-[36px_auto]">
        <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('purchase_individual_description_2')}</p>
      </div>
    </div>

    <Button href={getProductLink(ImmichProduct.Client)} fullwidth>{$t('purchase_button_select')}</Button>
  </div>
</div>
