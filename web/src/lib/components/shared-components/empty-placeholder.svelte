<script lang="ts">
  import empty1Url from '$lib/assets/empty-1.svg';

  export let actionHandler: undefined | (() => unknown) = undefined;
  export let text = '';
  export let alt = '';
  export let fullWidth = false;
  export let src = empty1Url;

  const noop = () => {};

  $: handler = actionHandler || noop;
  $: width = fullWidth ? 'w-full' : 'w-[50%]';

  const hoverClasses = actionHandler
    ? `border dark:border-immich-dark-gray hover:bg-immich-primary/5 dark:hover:bg-immich-dark-primary/25 hover:cursor-pointer`
    : '';
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:click={handler}
  on:keydown={handler}
  class="{width} m-auto mt-10 flex flex-col place-content-center place-items-center rounded-3xl bg-gray-50 p-5 dark:bg-immich-dark-gray {hoverClasses}"
>
  <img {src} {alt} width="500" draggable="false" />
  <p class="text-immich-text-gray-500 text-center dark:text-immich-dark-fg">{text}</p>
</div>
