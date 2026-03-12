<script lang="ts">
  import { focusOutside } from '$lib/actions/focus-outside';
  import { shortcuts } from '$lib/actions/shortcut';
  import { generateId } from '$lib/utils/generate-id';
  import { Icon } from '@immich/ui';
  import { mdiStar, mdiStarOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export type Rating = 1 | 2 | 3 | 4 | 5 | null;

  interface Props {
    count?: number;
    rating: Rating;
    readOnly?: boolean;
    onRating: (rating: Rating) => void | undefined;
  }

  let { count = 5, rating, readOnly = false, onRating }: Props = $props();

  let ratingSelection = $derived(rating);
  let hoverRating: Rating = $state(null);
  let focusRating: Rating = $state(null);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const id = generateId();

  const handleSelect = (newRating: Rating) => {
    if (readOnly) {
      return;
    }

    if (newRating === rating) {
      return;
    }

    onRating(newRating);
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
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      handleSelect(value);
    }, 300);
  };
</script>

<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<fieldset
  class="text-primary w-fit cursor-default"
  onmouseleave={() => setHoverRating(null)}
  use:focusOutside={{ onFocusOut: reset }}
  use:shortcuts={[
    { shortcut: { key: 'ArrowLeft' }, preventDefault: false, onShortcut: (event) => event.stopPropagation() },
    { shortcut: { key: 'ArrowRight' }, preventDefault: false, onShortcut: (event) => event.stopPropagation() },
  ]}
>
  <legend class="sr-only">{$t('rating')}</legend>
  <div class="flex flex-row" data-testid="star-container">
    {#each { length: count } as _, index (index)}
      {@const value = index + 1}
      {@const filled = hoverRating === null ? (ratingSelection || 0) >= value : hoverRating >= value}
      {@const starId = `${id}-${value}`}
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
  <button
    type="button"
    onclick={() => {
      ratingSelection = null;
      handleSelect(ratingSelection);
    }}
    class="cursor-pointer text-xs text-primary"
  >
    {$t('rating_clear')}
  </button>
{/if}
