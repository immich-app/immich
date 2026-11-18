<script lang="ts">
  import { focusOutside } from '#lib/actions/focus-outside.ts';
  import { Icon, shortcuts } from '@immich/ui';
  import { mdiStar, mdiStarOutline } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  export type Rating = -1 | 1 | 2 | 3 | 4 | 5 | null;

  type Props = {
    count?: number;
    rating: Rating;
    readOnly?: boolean;
    onRating: (rating: Rating) => void | undefined;
  };

  const { count = 5, rating, readOnly = false, onRating }: Props = $props();

  let ratingSelection = $state<Rating>(rating);
  let hoverRating: Rating = $state(null);
  let focusRating: Rating = $state(null);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let pendingDebouncedRating: { value: Rating; ratingCallback: Props['onRating'] } | undefined;

  const id = $props.id();

  $effect(() => {
    ratingSelection = rating;
    clearTimeout(timeoutId);
    timeoutId = undefined;
    pendingDebouncedRating = undefined;
  });

  onDestroy(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      if (pendingDebouncedRating) {
        handleSelect(pendingDebouncedRating.value, pendingDebouncedRating.ratingCallback);
      }
    }
  });

  const handleSelect = (newRating: Rating, ratingCallback: Props['onRating'] = onRating) => {
    if (readOnly) {
      return;
    }

    if (newRating === rating) {
      return;
    }

    ratingSelection = newRating;
    ratingCallback(newRating);
  };

  const setHoverRating = (value: Rating) => {
    if (readOnly) {
      return;
    }
    hoverRating = value;
  };

  const reset = () => {
    setHoverRating(null);
    focusRating = null;
  };

  const handleSelectDebounced = (value: Rating) => {
    if (readOnly) {
      return;
    }

    clearTimeout(timeoutId);
    ratingSelection = value;
    const ratingCallback = onRating;
    pendingDebouncedRating = { value, ratingCallback };
    timeoutId = setTimeout(() => {
      pendingDebouncedRating = undefined;
      handleSelect(value, ratingCallback);
    }, 300);
  };
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<fieldset
  class="w-fit cursor-default text-primary"
  onmouseleave={() => setHoverRating(null)}
  {@attach focusOutside({ onFocusOut: reset })}
  {@attach shortcuts([
    { shortcut: { key: 'ArrowLeft' }, preventDefault: false, onShortcut: (event) => event.stopPropagation() },
    { shortcut: { key: 'ArrowRight' }, preventDefault: false, onShortcut: (event) => event.stopPropagation() },
  ])}
>
  <legend class="sr-only">{$t('rating')}</legend>
  <div class="flex flex-row" data-testid="star-container">
    {#each { length: count } as _, index (index)}
      {const value = index + 1}
      {const filled = $derived(hoverRating === null ? (ratingSelection ?? 0) >= value : hoverRating >= value)}
      {const starId = `${id}-${value}`}
      <!-- svelte-ignore a11y_mouse_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <label
        for={starId}
        class:cursor-pointer={!readOnly}
        class:ring-2={focusRating === value}
        onmouseover={() => setHoverRating(value as Rating)}
        tabindex={-1}
        data-testid="star"
      >
        <span class="sr-only">{$t('rating_count', { values: { count: value } })}</span>
        <Icon icon={filled ? mdiStar : mdiStarOutline} size="1.5em" aria-hidden />
      </label>
      <input
        type="radio"
        name="stars"
        {value}
        id={starId}
        bind:group={ratingSelection}
        disabled={readOnly}
        onfocus={() => {
          focusRating = value as Rating;
        }}
        onchange={() => handleSelectDebounced(value as Rating)}
        class="sr-only"
      />
    {/each}
  </div>
</fieldset>
{#if ratingSelection !== null && !readOnly}
  <button type="button" onclick={() => handleSelect(null)} class="cursor-pointer text-xs text-primary">
    {$t('rating_clear')}
  </button>
{/if}
