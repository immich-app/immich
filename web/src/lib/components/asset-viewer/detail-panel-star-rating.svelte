<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  const countStars = 5;

  $: rating = asset.exifInfo?.rating || 0;
  let currentRating = rating;

  const handleChangeRating = async () => {
    if (currentRating === asset.exifInfo?.rating) {
      return;
    }
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { rating: currentRating } });
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
    rating = currentRating;
  };
</script>

<section class="relative flex px-4">
  <div class="relative gap-2">
    <div class="flex">
      {#each { length: countStars } as _, id}
        {#if rating > id}
          <span
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              transform="scale(0.9,0.9)"
              class="w-6 h-6 text-yellow-400 cursor-pointer"
            >
              <path
                fill-rule="evenodd"
                d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                clip-rule="evenodd"
              ></path>
            </svg></span
          >
        {:else}
          <span
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              transform="scale(0.9,0.9)"
              class="w-6 h-6 cursor-pointer text-blue-gray-500"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              >
              </path>
            </svg></span
          >
        {/if}
      {/each}
    </div>

    {#if isOwner}
      <input
        name="starrating"
        class="opacity-0
        cursor-pointer
        absolute top-[0] -left-[30px] w-[120%] right-[0] h-full"
        type="range"
        min="0"
        max={countStars}
        step="1"
        on:change={handleChangeRating}
        on:click
        bind:value={currentRating}
      />
    {:else}
      <input
        name="starrating"
        class="opacity-0
        absolute top-[0] -left-[30px] w-[120%] right-[0] h-full"
        type="range"
        min="0"
        max={countStars}
        step="1"
        on:click
        bind:value={currentRating}
      />
    {/if}
  </div>
</section>
