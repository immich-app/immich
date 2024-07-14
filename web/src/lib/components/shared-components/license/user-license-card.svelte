<script lang="ts">
  import { page } from '$app/stores';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getProductLink } from '$lib/utils/license-utils';
  import { mdiAccount, mdiCheckCircleOutline } from '@mdi/js';
  import { onMount } from 'svelte';

  let productUrl = 'https://pay.futo.org';

  onMount(async () => {
    productUrl = await getProductLink($page.url.origin, 'immich-client');
  });
</script>

<!-- USER LICENSE -->
<div class="border border-gray-300 dark:border-gray-800 w-[375px] p-8 rounded-3xl bg-gray-100 dark:bg-gray-900">
  <div class="text-immich-primary dark:text-immich-dark-primary">
    <Icon path={mdiAccount} size="56" />
    <p class="font-semibold text-lg mt-1">User License</p>
  </div>

  <div class="mt-4 dark:text-immich-gray">
    <p class="text-6xl font-bold">$24<span class="text-2xl font-medium">.99</span></p>
    <p>per user</p>
  </div>

  <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
    <div class="mt-6 flex flex-col gap-1">
      <div class="grid grid-cols-[36px_auto]">
        <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">1 license per user on any server</p>
      </div>

      <div class="grid grid-cols-[36px_auto]">
        <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
        <p class="self-center">Lifetime license</p>
      </div>
    </div>

    <a href={productUrl}>
      <Button fullwidth>Select</Button>
    </a>
  </div>
</div>
