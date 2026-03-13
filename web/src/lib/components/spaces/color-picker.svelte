<script lang="ts">
  import { UserAvatarColor } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';

  interface Props {
    value: UserAvatarColor;
    onchange: (color: UserAvatarColor) => void;
  }

  let { value, onchange }: Props = $props();

  const colors: { value: UserAvatarColor; class: string }[] = [
    { value: UserAvatarColor.Primary, class: 'bg-primary' },
    { value: UserAvatarColor.Pink, class: 'bg-pink-400' },
    { value: UserAvatarColor.Red, class: 'bg-red-500' },
    { value: UserAvatarColor.Yellow, class: 'bg-yellow-500' },
    { value: UserAvatarColor.Blue, class: 'bg-blue-500' },
    { value: UserAvatarColor.Green, class: 'bg-green-600' },
    { value: UserAvatarColor.Purple, class: 'bg-purple-600' },
    { value: UserAvatarColor.Orange, class: 'bg-orange-600' },
    { value: UserAvatarColor.Gray, class: 'bg-gray-600' },
    { value: UserAvatarColor.Amber, class: 'bg-amber-600' },
  ];
</script>

<div class="flex gap-2 flex-wrap">
  {#each colors as color (color.value)}
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-full transition-transform {color.class}"
      class:ring-2={value === color.value}
      class:ring-offset-2={value === color.value}
      class:ring-gray-800={value === color.value}
      class:dark:ring-gray-200={value === color.value}
      class:dark:ring-offset-gray-900={value === color.value}
      class:scale-110={value === color.value}
      onclick={() => onchange(color.value)}
      aria-label={color.value}
      data-testid="color-swatch-{color.value}"
    >
      {#if value === color.value}
        <Icon icon={mdiCheck} size="14" class="text-white" />
      {/if}
    </button>
  {/each}
</div>
