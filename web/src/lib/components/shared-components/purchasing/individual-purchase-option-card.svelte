<script lang="ts">
  import { ImmichProduct } from '$lib/constants';
  import { getLicenseLink as getProductLink } from '$lib/utils/license-utils';
  import { Button, Icon } from '@immich/ui';
  import { mdiAccount, mdiCheckCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<!-- Individual Purchase Option -->
<div
  class="border border-gray-300 dark:border-gray-800 w-[min(375px,100%)] p-8 rounded-3xl bg-gray-100 dark:bg-gray-900"
>
  <div class="text-primary">
    <Icon icon={mdiAccount} size="56" />
    <p class="font-semibold text-lg mt-1">{$t('purchase_individual_title')}</p>
  </div>

  <div class="mt-4 dark:text-immich-gray">
    <p class="text-6xl font-bold">$25</p>
    <p>{$t('purchase_per_user')}</p>
  </div>

  <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
    <div class="mt-6 flex flex-col gap-1">
      <div class="grid grid-cols-[36px_auto]">
        <Icon icon={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('purchase_individual_description_1')}</p>
      </div>

      <div class="grid grid-cols-[36px_auto]">
        <Icon icon={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('purchase_lifetime_description')}</p>
      </div>

      <div class="grid grid-cols-[36px_auto]">
        <Icon icon={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('purchase_individual_description_2')}</p>
      </div>
    </div>

    <Button shape="round" href={getProductLink(ImmichProduct.Client)} fullWidth>{$t('purchase_button_select')}</Button>
  </div>
</div>
