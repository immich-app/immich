<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';

  export let count = 5;
  export let rating: number;
  export let readOnly = false;
  export let onRating: (rating: number) => void | undefined;

  let hoverRating = 0;

  const starIcon =
    'M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z';

  const handleSelect = (newRating: number) => {
    if (readOnly) {
      return;
    }

    if (newRating === rating) {
      newRating = 0;
    }

    rating = newRating;

    onRating?.(rating);
  };
</script>

<div role="presentation" tabindex="-1" on:mouseout={() => (hoverRating = 0)} on:blur|preventDefault>
  {#each { length: count } as _, index}
    {@const value = index + 1}
    {@const filled = hoverRating >= value || (hoverRating === 0 && rating >= value)}
    <button
      type="button"
      on:click={() => handleSelect(value)}
      on:mouseover={() => (hoverRating = value)}
      on:focus|preventDefault={() => (hoverRating = value)}
      class="shadow-0 outline-0 text-immich-primary dark:text-immich-dark-primary"
      disabled={readOnly}
    >
      <Icon
        path={starIcon}
        size="1.5em"
        strokeWidth={1}
        color={filled ? 'currentcolor' : 'transparent'}
        strokeColor={filled ? 'currentcolor' : '#c1cce8'}
      />
    </button>
  {/each}
</div>
