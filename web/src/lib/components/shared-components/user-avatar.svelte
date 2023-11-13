<script lang="ts" context="module">
  export type Color = 'primary' | 'pink' | 'red' | 'yellow' | 'blue' | 'green';
  export type Size = 'full' | 'sm' | 'md' | 'lg' | 'xl';
</script>

<script lang="ts">
  import { imageLoad } from '$lib/utils/image-load';
  import { api } from '@api';

  interface User {
    id: string;
    name: string;
    email: string;
    profileImagePath: string;
  }

  export let user: User;
  export let color: Color = 'primary';
  export let size: Size = 'full';
  export let rounded = true;
  export let interactive = false;
  export let showTitle = true;
  export let autoColor = false;
  let showFallback = true;

  const colorClasses: Record<Color, string> = {
    primary: 'bg-immich-primary dark:bg-immich-dark-primary text-immich-dark-fg dark:text-immich-fg',
    pink: 'bg-pink-400 text-immich-bg',
    red: 'bg-red-500 text-immich-bg',
    yellow: 'bg-yellow-500 text-immich-bg',
    blue: 'bg-blue-500 text-immich-bg',
    green: 'bg-green-600 text-immich-bg',
  };

  const sizeClasses: Record<Size, string> = {
    full: 'w-full h-full',
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  // Get color based on the user UUID.
  function getUserColor() {
    const seed = parseInt(user.id.split('-')[0], 16);
    const colors = Object.keys(colorClasses).filter((color) => color !== 'primary') as Color[];
    const randomIndex = seed % colors.length;
    return colors[randomIndex];
  }

  $: colorClass = colorClasses[autoColor ? getUserColor() : color];
  $: sizeClass = sizeClasses[size];
  $: title = `${user.name} (${user.email})`;
  $: interactiveClass = interactive
    ? 'border-2 border-immich-primary hover:border-immich-dark-primary dark:hover:border-immich-primary dark:border-immich-dark-primary transition-colors'
    : '';
</script>

<figure
  class="{sizeClass} {colorClass} {interactiveClass} overflow-hidden shadow-md"
  class:rounded-full={rounded}
  title={showTitle ? title : undefined}
>
  {#if user.profileImagePath}
    <img
      src={api.getProfileImageUrl(user.id)}
      alt="Profile image of {title}"
      class="h-full w-full object-cover"
      class:hidden={showFallback}
      draggable="false"
      use:imageLoad
      on:image-load={() => (showFallback = false)}
    />
  {/if}
  {#if showFallback}
    <span
      class="flex h-full w-full select-none items-center justify-center"
      class:text-xs={size === 'sm'}
      class:text-lg={size === 'lg'}
      class:text-xl={size === 'xl'}
      class:font-medium={!autoColor}
      class:font-semibold={autoColor}
    >
      {(user.name[0] || '').toUpperCase()}
    </span>
  {/if}
</figure>
