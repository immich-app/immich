<script lang="ts">
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Input, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    query: string | undefined;
  }

  let { query = $bindable() }: Props = $props();
</script>

{#if featureFlagsManager.value.smartSearch}
  <section>
    <Text fontWeight="medium">{$t('admin.machine_learning_smart_search')}</Text>

    <div class="mt-1">
      <Input type="text" placeholder={$t('sunrise_on_the_beach')} bind:value={query} aria-label={$t('search_by_context')} />
    </div>
  </section>
{/if}
