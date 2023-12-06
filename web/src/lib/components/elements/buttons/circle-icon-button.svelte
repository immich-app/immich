<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';

  export let icon: string;
  export let backgroundColor = '';
  export let hoverColor = '#e2e7e9';
  export let padding = '3';
  export let size = '24';
  export let title = '';
  export let isOpacity = false;
  export let forceDark = false;
  export let hideMobile = false;
  export let iconColor = 'currentColor';
  export let buttonSize: string | undefined = undefined;
</script>

<button
  {title}
  style:width={buttonSize ? buttonSize + 'px' : ''}
  style:height={buttonSize ? buttonSize + 'px' : ''}
  style:background-color={backgroundColor}
  style:--immich-icon-button-hover-color={hoverColor}
  class:dark:text-immich-dark-fg={!forceDark}
  class="flex place-content-center place-items-center rounded-full p-{padding} transition-all
	{isOpacity ? 'hover:bg-immich-bg/30' : 'immich-circle-icon-button hover:dark:text-immich-dark-gray'}
  {forceDark && 'hover:text-black'}
  {hideMobile && 'hidden sm:flex'}"
  on:click
>
  <Icon path={icon} {size} color={iconColor} />
  <slot />
</button>

<style>
  :root {
    --immich-icon-button-hover-color: #d3d3d3;
  }

  .immich-circle-icon-button:hover {
    background-color: var(--immich-icon-button-hover-color) !important;
  }
</style>
