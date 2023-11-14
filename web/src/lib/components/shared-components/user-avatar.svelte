<script lang="ts" context="module">
  export type Size = 'full' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
</script>

<script lang="ts">
  import { imageLoad } from '$lib/utils/image-load';
  import { UserAvatarColor, api } from '@api';

  interface User {
    id: string;
    name: string;
    email: string;
    profileImagePath: string;
    avatarColor: UserAvatarColor;
  }

  export let user: User;
  export let color: UserAvatarColor = user.avatarColor;
  export let size: Size = 'full';
  export let rounded = true;
  export let interactive = false;
  export let showTitle = true;
  export let showProfileImage = true;

  let showFallback = true;

  const colorClasses: Record<UserAvatarColor, string> = {
    primary: 'bg-immich-primary dark:bg-immich-dark-primary text-immich-dark-fg dark:text-immich-fg',
    pink: 'bg-pink-400 text-immich-bg',
    red: 'bg-red-500 text-immich-bg',
    yellow: 'bg-yellow-500 text-immich-bg',
    blue: 'bg-blue-500 text-immich-bg',
    green: 'bg-green-600 text-immich-bg',
    purple: 'bg-purple-600 text-immich-bg',
    orange: 'bg-orange-600 text-immich-bg',
    gray: 'bg-gray-600 text-immich-bg',
    amber: 'bg-amber-600 text-immich-bg',
  };

  const sizeClasses: Record<Size, string> = {
    full: 'w-full h-full',
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    xxl: 'w-24 h-24',
    xxxl: 'w-28 h-28',
  };

  $: colorClass = colorClasses[color];
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
  {#if showProfileImage && user.profileImagePath}
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
      class="flex h-full w-full select-none items-center justify-center font-medium"
      class:text-xs={size === 'sm'}
      class:text-lg={size === 'lg'}
      class:text-xl={size === 'xl'}
      class:text-2xl={size === 'xxl'}
      class:text-3xl={size === 'xxxl'}
    >
      {(user.name[0] || '').toUpperCase()}
    </span>
  {/if}
</figure>
