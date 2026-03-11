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

<div class="flex group transition-all">
  <span
    class="inline-block h-min whitespace-nowrap ps-3 pe-1 group-hover:ps-3 py-1 text-center align-baseline leading-none text-gray-100 dark:text-immich-dark-gray bg-primary rounded-s-full hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
  >
    <p class="text-sm">
      {label}
    </p>
  </span>

  <button
    type="button"
    class="text-gray-100 dark:text-immich-dark-gray bg-immich-primary/95 dark:bg-immich-dark-primary/95 rounded-e-full place-items-center place-content-center pe-2 ps-1 py-1 hover:bg-immich-primary/80 dark:hover:bg-immich-dark-primary/80 transition-all"
    title={$t('remove_tag')}
    onclick={onRemove}
  >
    <Icon icon={mdiClose} />
  </button>
</div>
