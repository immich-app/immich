<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { ImmichLicense } from '$lib/constants';
  import { getLicenseLink } from '$lib/utils/license-utils';
  import { mdiAccount, mdiCheckCircleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
</script>

<!-- USER LICENSE -->
<div class="border border-gray-300 dark:border-gray-800 w-[375px] p-8 rounded-3xl bg-gray-100 dark:bg-gray-900">
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <Icon path={mdiAccount} size="56" />
    <p class="font-semibold text-lg mt-1">{$t('license_individual_title')}</p>
  </div>

  <div class="mt-4 dark:text-immich-gray">
    <p class="text-6xl font-bold">$24<span class="text-2xl font-medium">.99</span></p>
    <p>{$t('license_per_user')}</p>
  </div>

  <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
    <div class="mt-6 flex flex-col gap-1">
      <div class="grid grid-cols-[36px_auto]">
        <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('license_individual_description_1')}</p>
      </div>

      <div class="grid grid-cols-[36px_auto]">
        <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">{$t('license_lifetime_description')}</p>
      </div>
    </div>

    <a href={getLicenseLink(ImmichLicense.Client)}>
      <Button fullwidth>{$t('license_button_select')}</Button>
    </a>
  </div>
</div>
