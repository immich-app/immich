<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { getSystemConfigActions } from '$lib/services/system-config.service';
  import { Alert, Button, CommandPaletteContext, Icon, Text } from '@immich/ui';
  import { mdiPencilOutline } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
    children?: Snippet;
  };

  const { data, children }: Props = $props();

  const { settings, CopyToClipboard, Upload, Download } = $derived(
    getSystemConfigActions($t, featureFlagsManager.value, systemConfigManager.value),
  );

  let searchQuery = $state('');
  let filteredSettings = $derived(
    settings.filter(({ title, subtitle }) => {
      const query = searchQuery.toLowerCase();
      return title.toLowerCase().includes(query) || subtitle.toLowerCase().includes(query);
    }),
  );
</script>

<CommandPaletteContext commands={[CopyToClipboard, Upload, Download]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[CopyToClipboard, Download, Upload]}>
  <section id="setting-content" class="flex place-content-center sm:mx-4 mt-4">
    <section class="w-full pb-28 sm:w-5/6 md:w-4xl">
      {#if featureFlagsManager.value.configFile}
        <Alert color="warning" class="text-dark my-4" title={$t('admin.config_set_by_file')} />
      {/if}
      <div class="mb-4">
        <SearchBar placeholder={$t('search_settings')} bind:name={searchQuery} showLoadingSpinner={false} />
      </div>
      <div class="flex flex-col gap-2">
        {#each filteredSettings as { title, subtitle, href, icon } (href)}
          <Button variant="outline" color="secondary" class="flex justify-between border-subtle" {href}>
            <div class="flex flex-col items-start">
              <Text size="large" fontWeight="semi-bold" color="primary" class="flex items-center gap-2">
                <Icon {icon} />
                {title}
              </Text>
              <Text>{subtitle}</Text>
            </div>
            <Icon icon={mdiPencilOutline} size="1.5rem" />
          </Button>
        {/each}
      </div>
    </section>
  </section>
</AdminPageLayout>

{@render children?.()}
