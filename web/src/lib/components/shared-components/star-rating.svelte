<script lang="ts">
  import { focusOutside } from '$lib/actions/focus-outside';
  import { shortcuts } from '$lib/actions/shortcut';
  import Icon from '$lib/components/elements/icon.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { t } from 'svelte-i18n';

  export let count = 5;
  export let rating: number;
  export let readOnly = false;
  export let onRating: (rating: number) => void | undefined;

  let ratingSelection = 0;
  let hoverRating = 0;
  let focusRating = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  $: ratingSelection = rating;

  const starIcon =
    'M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z';
  const id = generateId();

  const handleSelect = (newRating: number) => {
    if (readOnly) {
      return;
    }

    if (newRating === rating) {
      return;
    }

    onRating(newRating);
  };

  const setHoverRating = (value: number) => {
    if (readOnly) {
      return;
    }
    hoverRating = value;
  };

  const reset = () => {
    setHoverRating(0);
    focusRating = 0;
  };

  const handleSelectDebounced = (value: number) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      handleSelect(value);
    }, 300);
  };
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<fieldset
  class="text-immich-primary dark:text-immich-dark-primary w-fit cursor-default"
  on:mouseleave={() => setHoverRating(0)}
  use:focusOutside={{ onFocusOut: reset }}
  use:shortcuts={[
    { shortcut: { key: 'ArrowLeft' }, preventDefault: false, onShortcut: (event) => event.stopPropagation() },
    { shortcut: { key: 'ArrowRight' }, preventDefault: false, onShortcut: (event) => event.stopPropagation() },
  ]}
>
  <legend class="sr-only">{$t('rating')}</legend>
  <div class="flex flex-row" data-testid="star-container">
    {#each { length: count } as _, index}
      {@const value = index + 1}
      {@const filled = hoverRating >= value || (hoverRating === 0 && ratingSelection >= value)}
      {@const starId = `${id}-${value}`}
      <!-- svelte-ignore a11y-mouse-events-have-key-events -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <label
        for={starId}
        class:cursor-pointer={!readOnly}
        class:ring-2={focusRating === value}
        on:mouseover={() => setHoverRating(value)}
        tabindex={-1}
        data-testid="star"
      >
        <span class="sr-only">{$t('rating_count', { values: { count: value } })}</span>
        <Icon
          path={starIcon}
          size="1.5em"
          strokeWidth={1}
          color={filled ? 'currentcolor' : 'transparent'}
          strokeColor={filled ? 'currentcolor' : '#c1cce8'}
          ariaHidden
        />
      </label>
      <input
        type="radio"
        name="stars"
        {value}
        id={starId}
        bind:group={ratingSelection}
        disabled={readOnly}
        on:focus={() => {
          focusRating = value;
        }}
        on:change={() => handleSelectDebounced(value)}
        class="sr-only"
      />
    {/each}
  </div>
</fieldset>
{#if ratingSelection > 0 && !readOnly}
  <button
    type="button"
    on:click={() => {
      ratingSelection = 0;
      handleSelect(ratingSelection);
    }}
    class="cursor-pointer text-xs text-immich-primary dark:text-immich-dark-primary"
  >
    {$t('rating_clear')}
  </button>
{/if}
