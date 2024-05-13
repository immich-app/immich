<script lang="ts">
  import empty1Url from '$lib/assets/empty-1.svg';

  export let onClick: undefined | (() => unknown) = undefined;
  export let text: string;
  export let fullWidth = false;
  export let src = empty1Url;

  $: width = fullWidth ? 'w-full' : 'w-1/2';

  const hoverClasses = onClick
    ? `border dark:border-immich-dark-gray hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25`
    : '';
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<svelte:element
  this={onClick ? 'button' : 'div'}
  on:click={onClick}
  class="{width} m-auto mt-10 flex flex-col place-content-center place-items-center rounded-3xl bg-gray-50 p-5 dark:bg-immich-dark-gray {hoverClasses}"
>
  <img {src} alt="" width="500" draggable="false" />
  <p class="text-immich-text-gray-500 dark:text-immich-dark-fg">{text}</p>
</svelte:element>
