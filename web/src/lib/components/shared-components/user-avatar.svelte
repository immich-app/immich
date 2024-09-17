<script lang="ts" context="module">
  export type Size = 'full' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
</script>

<script lang="ts">
  import { getProfileImageUrl } from '$lib/utils';
  import { type UserAvatarColor } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface User {
    id: string;
    name: string;
    email: string;
    profileImagePath: string;
    avatarColor: UserAvatarColor;
    profileChangedAt: string;
  }

  export let user: User;
  export let color: UserAvatarColor | undefined = undefined;
  export let size: Size = 'full';
  export let rounded = true;
  export let interactive = false;
  export let showTitle = true;
  export let showProfileImage = true;
  export let label: string | undefined = undefined;

  let img: HTMLImageElement;
  let showFallback = true;

  // sveeeeeeelteeeeee fiveeeeee
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  $: img, user, void tryLoadImage();

  const tryLoadImage = async () => {
    try {
      await img.decode();
      showFallback = false;
    } catch {
      showFallback = true;
    }
  };

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

  $: colorClass = colorClasses[color || user.avatarColor];
  $: sizeClass = sizeClasses[size];
  $: title = label ?? `${user.name} (${user.email})`;
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
      bind:this={img}
      src={getProfileImageUrl(user)}
      alt={$t('profile_image_of_user', { values: { user: title } })}
      class="h-full w-full object-cover"
      class:hidden={showFallback}
      draggable="false"
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
