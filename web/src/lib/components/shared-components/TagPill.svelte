<script lang="ts">
  import { Icon, Tooltip } from '@immich/ui';
  import { mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    label: string;
    partial?: boolean;
    tooltipText?: string;
    onRemove: () => void;
  };

  let { label, partial, tooltipText, onRemove }: Props = $props();
</script>

<div class="group flex transition-all">
  <Tooltip text={tooltipText || null} delayDuration={300}>
    {#snippet child({ props })}
      <span
        {...props}
        class={`
          inline-block h-min rounded-s-full py-1 ps-3 pe-1 text-center align-baseline
          leading-none whitespace-nowrap text-gray-100 transition-all group-hover:ps-3
          hover:bg-immich-primary/80 dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80
          ${partial ? 'bg-gray-500' : 'bg-primary'}
        `}
        data-testid="tag-pill-label"
      >
        <p class="text-sm">
          {label}
        </p>
      </span>

      <button
        type="button"
        class={`
          place-content-center place-items-center rounded-e-full py-1 ps-1 pe-2 text-gray-100 transition-all hover:bg-immich-primary/80 dark:text-immich-dark-gray dark:hover:bg-immich-dark-primary/80
          ${partial ? 'bg-gray-500/95' : 'bg-immich-primary/95 dark:bg-immich-dark-primary/95'}
        `}
        title={$t('remove_tag')}
        onclick={onRemove}
        data-testid="tag-pill-remove-button"
      >
        <Icon icon={mdiClose} />
      </button>
    {/snippet}
  </Tooltip>
</div>
