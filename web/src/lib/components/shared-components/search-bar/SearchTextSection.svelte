<script lang="ts">
  import { searchTypeTitle } from '$lib/components/shared-components/search-bar/search-bar-utils';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import { Button, Text } from '@immich/ui';
  import { mdiCheck } from '@mdi/js';
  import { t } from 'svelte-i18n';

  let queryType = $derived(searchManager.filter.queryType);

  const setType = (type: 'smart' | 'metadata' | 'description' | 'fullPath' | 'ocr') => {
    searchManager.filter.queryType = type;
  };
</script>

<section>
  <fieldset>
    <Text class="mb-5">{$t('search_type_description')}</Text>
    <div class="flex flex-wrap gap-2">
      {#if featureFlagsManager.value.smartSearch}
        <Button
          shape="round"
          color={queryType === 'smart' ? 'primary' : 'secondary'}
          variant="outline"
          onclick={() => setType('smart')}
          class={queryType === 'smart' ? undefined : 'bg-transparent'}
          leadingIcon={queryType === 'smart' ? mdiCheck : undefined}
          >{$t('context')}
        </Button>
      {/if}
      <Button
        shape="round"
        color={queryType === 'metadata' ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => setType('metadata')}
        class={queryType === 'metadata' ? undefined : 'bg-transparent'}
        leadingIcon={queryType === 'metadata' ? mdiCheck : undefined}
        >{searchTypeTitle('metadata')}
      </Button>
      <Button
        shape="round"
        color={queryType === 'description' ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => setType('description')}
        class={queryType === 'description' ? undefined : 'bg-transparent'}
        leadingIcon={queryType === 'description' ? mdiCheck : undefined}
        >{searchTypeTitle('description')}
      </Button>
      <Button
        shape="round"
        color={queryType === 'fullPath' ? 'primary' : 'secondary'}
        variant="outline"
        onclick={() => setType('fullPath')}
        class={queryType === 'fullPath' ? undefined : 'bg-transparent'}
        leadingIcon={queryType === 'fullPath' ? mdiCheck : undefined}
        >{searchTypeTitle('fullPath')}
      </Button>
      {#if featureFlagsManager.value.ocr}
        <Button
          shape="round"
          color={queryType === 'ocr' ? 'primary' : 'secondary'}
          variant="outline"
          onclick={() => setType('ocr')}
          class={queryType === 'ocr' ? undefined : 'bg-transparent'}
          leadingIcon={queryType === 'ocr' ? mdiCheck : undefined}
          >{searchTypeTitle('ocr')}
        </Button>
      {/if}
    </div>
  </fieldset>
</section>
