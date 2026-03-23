<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiStar } from '@mdi/js';

  interface Props {
    selectedRating?: number;
    onRatingChange: (rating?: number) => void;
  }

  let { selectedRating, onRatingChange }: Props = $props();

  function handleStarClick(star: number) {
    if (selectedRating === star) {
      onRatingChange(undefined);
    } else {
      onRatingChange(star);
    }
  }
</script>

<div class="flex gap-1" data-testid="rating-filter">
  {#each [1, 2, 3, 4, 5] as star (star)}
    {@const filled = selectedRating !== undefined && star <= selectedRating}
    <button
      type="button"
      class="flex items-center justify-center p-0.5"
      onclick={() => handleStarClick(star)}
      data-testid="rating-star-{star}"
    >
      <Icon icon={mdiStar} size="20" class={filled ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'} />
    </button>
  {/each}
</div>
