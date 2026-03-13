<script lang="ts">
  import type { UserAvatarColor } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    role: string;
    spaceColor?: UserAvatarColor | string | null;
    size?: 'sm' | 'md';
  }

  let { role, spaceColor = 'primary', size = 'md' }: Props = $props();

  const colorMap: Record<string, { filled: string; outlined: string }> = {
    primary: { filled: 'bg-primary text-white', outlined: 'border-primary text-primary' },
    pink: { filled: 'bg-pink-400 text-white', outlined: 'border-pink-400 text-pink-400' },
    red: { filled: 'bg-red-500 text-white', outlined: 'border-red-500 text-red-500' },
    yellow: { filled: 'bg-yellow-500 text-white', outlined: 'border-yellow-500 text-yellow-600' },
    blue: { filled: 'bg-blue-500 text-white', outlined: 'border-blue-500 text-blue-500' },
    green: { filled: 'bg-green-600 text-white', outlined: 'border-green-600 text-green-600' },
    purple: { filled: 'bg-purple-600 text-white', outlined: 'border-purple-600 text-purple-600' },
    orange: { filled: 'bg-orange-600 text-white', outlined: 'border-orange-600 text-orange-600' },
    gray: { filled: 'bg-gray-600 text-white', outlined: 'border-gray-600 text-gray-600' },
    amber: { filled: 'bg-amber-600 text-white', outlined: 'border-amber-600 text-amber-600' },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  let colors = $derived(colorMap[spaceColor ?? 'primary'] ?? colorMap.primary);
  let badgeClass = $derived.by(() => {
    if (role === 'owner') {
      return `${colors.filled} ${sizeClasses[size]}`;
    }
    if (role === 'editor') {
      return `border ${colors.outlined} ${sizeClasses[size]}`;
    }
    return `bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 ${sizeClasses[size]}`;
  });

  const roleLabel = $derived(
    role === 'owner' ? $t('owner') : role === 'editor' ? $t('role_editor') : $t('role_viewer'),
  );
</script>

<span class="inline-flex items-center rounded-full font-medium capitalize {badgeClass}" data-testid="role-badge-{role}">
  {roleLabel}
</span>
