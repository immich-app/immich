<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiInformationOutline, mdiLicense } from '@mdi/js';

  let isLicensed = false;
  let showMessage = false;
</script>

<div class="dark:text-immich-dark-fg">
  <div>
    <hr class="my-4 ml-5 dark:border-immich-dark-gray" />
  </div>
  <div class="server-status grid grid-cols-[64px_auto]">
    <div class="pb-11 pl-5 pr-6 group-hover:sm:pb-0 md:pb-0">
      <Icon
        path={mdiLicense}
        size="26"
        class={isLicensed
          ? 'text-immich-primary dark:text-immich-dark-primary'
          : 'text-immich-dark-gray/75 dark:text-immich-gray/85'}
      />
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
          <p class="font-medium text-immich-dark-gray/75 dark:text-immich-gray/85">Unlicensed</p>
          <p>-</p>
          <div class="">
            <button
              class="text-immich-primary dark:text-immich-dark-primary relative flex place-items-center gap-[2px] flex-shrink-0 font-semibold underline"
              >Buy

              <span
                role="contentinfo"
                on:mouseenter={() => (showMessage = true)}
                on:mouseleave={() => (showMessage = false)}
              >
                <Icon path={mdiInformationOutline}></Icon>
              </span>

              {#if showMessage}
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
