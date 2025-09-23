<script lang="ts" module>
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

  interface Props {
    user: User;
    size?: Size;
    interactive?: boolean;
    noTitle?: boolean;
    label?: string | undefined;
  }

  let { user, size = 'full', interactive = false, noTitle = false, label = undefined }: Props = $props();

  let img: HTMLImageElement | undefined = $state();
  let showFallback = $state(true);

  const tryLoadImage = async () => {
    try {
      await img?.decode();
      showFallback = false;
    } catch {
      showFallback = true;
    }
  };

  const colorClasses: Record<UserAvatarColor, string> = {
    primary: 'bg-primary text-light dark:text-light',
    pink: 'bg-pink-400 text-light dark:text-dark',
    red: 'bg-red-500 text-light dark:text-dark',
    yellow: 'bg-yellow-500 text-light dark:text-dark',
    blue: 'bg-blue-500 text-light dark:text-dark',
    green: 'bg-green-600 text-light dark:text-dark',
    purple: 'bg-purple-600 text-light dark:text-dark',
    orange: 'bg-orange-600 text-light dark:text-dark',
    gray: 'bg-gray-600 text-light dark:text-dark',
    amber: 'bg-amber-600 text-light dark:text-dark',
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

  $effect(() => {
    if (img && user) {
      tryLoadImage().catch(console.error);
    }
  });

  let colorClass = $derived(colorClasses[user.avatarColor]);
  let sizeClass = $derived(sizeClasses[size]);
  let title = $derived(label ?? `${user.name} (${user.email})`);
  let interactiveClass = $derived(
    interactive
      ? 'border-2 border-immich-primary hover:border-immich-dark-primary dark:hover:border-immich-primary dark:border-immich-dark-primary transition-colors'
      : '',
  );
</script>

<figure
  class="{sizeClass} {colorClass} {interactiveClass} overflow-hidden shadow-md rounded-full"
  title={noTitle ? undefined : title}
>
  {#if user.profileImagePath}
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
      class="uppercase flex h-full w-full select-none items-center justify-center font-medium"
      class:text-xs={size === 'sm'}
      class:text-lg={size === 'lg'}
      class:text-xl={size === 'xl'}
      class:text-2xl={size === 'xxl'}
      class:text-3xl={size === 'xxxl'}
    >
      {user.name[0] || ''}
    </span>
  {/if}
</figure>
