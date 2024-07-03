<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { serverInfo } from '$lib/stores/server-info.store';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { mdiChartPie, mdiInformation, mdiInformationBox, mdiInformationOutline, mdiLicense } from '@mdi/js';
  import { t, locale } from 'svelte-i18n';

  let isLicensed = true;
</script>

<div class="dark:text-immich-dark-fg">
  <div>
    <hr class="my-4 ml-5 dark:border-immich-dark-gray" />
  </div>
  <div class="server-status grid grid-cols-[64px_auto]">
    <div class="pb-11 pl-5 pr-6 text-immich-primary dark:text-immich-dark-primary group-hover:sm:pb-0 md:pb-0">
      <Icon path={mdiLicense} size="26" />
    </div>

    <!-- Sample -1  -->
    <!-- <div class="hidden text-xs group-hover:sm:block md:block self-center">
      {#if isLicensed}
        <p class="underline text-sm font-medium text-immich-primary dark:text-immich-dark-primary">Licensed</p>
      {:else}
        <p class="text-sm font-medium text-immich-dark-gray/75">Unlicensed</p>

        <div>
          <p class="text-xs my-2">You have been using Immich for approximately 3000 days</p>
        </div>
        <div class="w-full">
          <button class="w-full text-immich-primary font-semibold text-left">Purchase a License</button>
        </div>
      {/if}
    </div> -->

    <!-- Sample - 2  -->
    <!-- <div class="hidden group-hover:sm:block md:block self-center">
      {#if isLicensed}
        <p class="underline text-sm font-medium text-immich-primary dark:text-immich-dark-primary">Licensed</p>
      {:else}
        <div class="flex text-sm gap-1">
          <p class="font-medium text-immich-dark-gray/75">Unlicensed</p>
          <p>-</p>
          <div>
            <button class="flex flex-shrink-0 text-immich-primary font-semibold underline">Buy</button>
          </div>
        </div>

        <div>
          <p class="text-xs my-2">You have been using Immich for approximately 3000 days</p>
        </div>
      {/if}
    </div> -->

    <!-- Sample - 3  -->
    <div class="hidden group-hover:sm:block md:block self-center">
      {#if isLicensed}
        <p class="text-sm font-medium text-immich-primary dark:text-immich-dark-primary">Licensed</p>
      {:else}
        <div class="flex text-sm gap-1">
          <p class="font-medium text-immich-dark-gray/75">Unlicensed</p>
          <p>-</p>
          <div class="text-immich-primary">
            <button class="relative flex place-items-center gap-[2px] flex-shrink-0 font-semibold underline"
              >Buy
              <Icon path={mdiInformationOutline}></Icon>

              {#if false}
                <div
                  class="w-[150px] absolute bottom-5 -right-8 bg-white text-black border p-3 border-immich-primary rounded-3xl z-10"
                >
                  <p class="text-sm my-2 text-balance font-medium">
                    You have been using Immich for approximately 3000 days
                  </p>
                </div>
              {/if}
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
