<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    label: string;
    onRemove: () => void;
  };

  let { label, onRemove }: Props = $props();
</script>

<div class="group flex transition-all">
  <span
    class="inline-block h-min rounded-s-full bg-primary py-1 ps-3 pe-1 text-center align-baseline leading-none whitespace-nowrap text-gray-100 transition-all group-hover:ps-3 hover:bg-immich-primary/80 dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80"
  >
    <p class="text-sm">
      {label}
    </p>
  </span>

  <button
    type="button"
    class="place-content-center place-items-center rounded-e-full bg-immich-primary/95 py-1 ps-1 pe-2 text-gray-100 transition-all hover:bg-immich-primary/80 dark:bg-immich-dark-primary/95 dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80"
    title={$t('remove_tag')}
    onclick={onRemove}
  >
    <Icon icon={mdiClose} />
  </button>
</div>
