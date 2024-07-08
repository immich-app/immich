<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiInformationOutline, mdiLicense } from '@mdi/js';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';

  let isLicensed = false;
  let showMessage = false;
</script>

<div class="license-status pl-4 text-sm">
  {#if isLicensed}
    <div class="flex gap-1 mt-4 place-items-center">
      <Icon path={mdiLicense} size="18" class="text-immich-primary dark:text-immich-dark-primary" />
      <p class="text-immich-primary dark:text-immich-dark-primary">Licensed</p>
    </div>
  {:else}
    <div
      class="py-3 px-2 flex justify-between place-items-center place-content-center border border-gray-300 dark:border-immich-dark-primary/50 mt-2 rounded-lg shadow-sm dark:bg-immich-dark-primary/10"
    >
      <div class="flex place-items-center place-content-center gap-1">
        <Icon path={mdiLicense} size="18" class="text-immich-dark-gray/75 dark:text-immich-gray/85" />
        <p class="text-immich-dark-gray/75 dark:text-immich-gray">Unlicensed</p>
      </div>

      <div>
        <button
          type="button"
          class="text-immich-primary dark:text-immich-dark-primary flex place-items-center gap-[2px] font-medium"
          >Buy

          <span
            role="contentinfo"
            on:mouseenter={() => (showMessage = true)}
            on:mouseleave={() => (showMessage = false)}
          >
            <Icon path={mdiInformationOutline}></Icon>
          </span>
        </button>
      </div>
    </div>
  {/if}
</div>

<Portal target="body">
  {#if showMessage}
    <div
      class="w-[150px] absolute bottom-[75px] left-[255px] bg-white text-black border p-3 border-immich-primary rounded-3xl z-10"
    >
      <p class="my-2 text-balance font-medium">You have been using Immich for approximately 3000 days</p>
    </div>
  {/if}
</Portal>
