<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiInformationOutline, mdiLicense } from '@mdi/js';

  let isLicensed = false;
  let showMessage = false;
</script>

<div class="license-status ml-4 py-3 px-2 border border-gray-300 dark:border-immich-dark-primary/40 mt-2 rounded-lg">
  {#if isLicensed}
    <Icon
      path={mdiLicense}
      size="24"
      class={isLicensed
        ? 'text-immich-primary dark:text-immich-dark-primary'
        : 'text-immich-dark-gray/75 dark:text-immich-gray/85'}
    />
    <p class="text-sm font-medium text-immich-primary dark:text-immich-dark-primary">Licensed</p>
  {:else}
    <div class="flex justify-between place-items-center place-content-center">
      <div class="flex place-items-center place-content-center gap-1">
        <Icon
          path={mdiLicense}
          size="18"
          class={isLicensed
            ? 'text-immich-primary dark:text-immich-dark-primary'
            : 'text-immich-dark-gray/75 dark:text-immich-gray/85'}
        />
        <p class="text-immich-dark-gray/75 dark:text-immich-gray">Unlicensed</p>
      </div>

      <div>
        <button
          type="button"
          class="text-immich-primary dark:text-immich-dark-primary relative flex place-items-center gap-[2px] font-medium"
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
