<script lang="ts">
  import type { SearchImagePropsFilter } from '$lib/types';
  import { Input, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    filters: SearchImagePropsFilter;
  };

  let { filters = $bindable() }: Props = $props();
</script>

<div id="image-selection">
  <Text fontWeight="medium">{$t('image_properties')}</Text>

  <div class="mt-1 grid grid-auto-fit-40 gap-5">
    <fieldset>
      <Text class="mb-1 block text-xs font-light text-neutral-500" fontWeight="medium">{$t('aspect_ratio')}</Text>
      <div class="grid grid-cols-2 gap-1">
        <Input
          type="text"
          placeholder={$t('min_width')}
          aria-label={`${$t('min_aspect_ratio')} ${$t('width')}`}
          bind:value={filters.minAspectRatioWidth}
        />
        <div class="flex items-center gap-1">
          <Text aria-hidden="true" class="text-sm text-neutral-500">:</Text>
          <Input
            type="text"
            placeholder={$t('min_height')}
            aria-label={`${$t('min_aspect_ratio')} ${$t('height')}`}
            bind:value={filters.minAspectRatioHeight}
          />
        </div>
        <Input
          type="text"
          placeholder={$t('max_width')}
          aria-label={`${$t('max_aspect_ratio')} ${$t('width')}`}
          bind:value={filters.maxAspectRatioWidth}
        />
        <div class="flex items-center gap-1">
          <Text aria-hidden="true" class="text-sm text-neutral-500">:</Text>
          <Input
            type="text"
            placeholder={$t('max_height')}
            aria-label={`${$t('max_aspect_ratio')} ${$t('height')}`}
            bind:value={filters.maxAspectRatioHeight}
          />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <Text class="mb-1 block text-xs font-light text-neutral-500" fontWeight="medium">{$t('resolution')}</Text>
      <div class="grid grid-cols-2 gap-1">
        <Input type="text" placeholder={$t('min_width')} aria-label={$t('min_width')} bind:value={filters.minWidth} />
        <div class="flex items-center gap-1">
          <Text aria-hidden="true" class="text-sm text-neutral-500">x</Text>
          <Input
            type="text"
            placeholder={$t('min_height')}
            aria-label={$t('min_height')}
            bind:value={filters.minHeight}
          />
        </div>
        <Input type="text" placeholder={$t('max_width')} aria-label={$t('max_width')} bind:value={filters.maxWidth} />
        <div class="flex items-center gap-1">
          <Text aria-hidden="true" class="text-sm text-neutral-500">x</Text>
          <Input
            type="text"
            placeholder={$t('max_height')}
            aria-label={$t('max_height')}
            bind:value={filters.maxHeight}
          />
        </div>
      </div>
    </fieldset>
  </div>
</div>
