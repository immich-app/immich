<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { Icon, LoadingSpinner } from '@immich/ui';
  import { mdiCheckCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    faceId: string;
    thumbnailUrl: string;
    selected: boolean;
    disabled: boolean;
    pending?: boolean;
    onSelect: (faceId: string) => void;
  }

  let { faceId, thumbnailUrl, selected, disabled, pending = false, onSelect }: Props = $props();
</script>

<button
  type="button"
  aria-label={$t('select_representative_face')}
  disabled={disabled || pending}
  onclick={() => onSelect(faceId)}
  class={[
    'relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 text-left transition dark:bg-gray-800',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-immich-primary dark:focus-visible:ring-immich-dark-primary',
    selected
      ? 'ring-2 ring-immich-primary dark:ring-immich-dark-primary'
      : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600',
    disabled || pending ? 'cursor-default opacity-60' : 'cursor-pointer',
  ]}
>
  <ImageThumbnail
    curve
    url={thumbnailUrl}
    altText={$t('select_representative_face')}
    widthStyle="100%"
    heightStyle="100%"
    brokenAssetClass="size-full"
    preload={false}
  />

  {#if selected}
    <span data-testid="representative-face-selected" class="absolute right-1.5 top-1.5 rounded-full bg-white shadow-sm">
      <Icon icon={mdiCheckCircle} size="22" class="text-immich-primary dark:text-immich-dark-primary" />
    </span>
  {/if}

  {#if pending}
    <span
      data-testid="representative-face-pending"
      class="absolute inset-0 flex items-center justify-center bg-black/25"
    >
      <LoadingSpinner />
    </span>
  {/if}
</button>
