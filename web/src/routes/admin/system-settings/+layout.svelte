<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { getSystemConfigActions } from '$lib/services/system-config.service';
  import { Alert, Button, Card, CardHeader, CardTitle, CommandPaletteContext, Container, Icon, Text } from '@immich/ui';
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
  const filteredGroups = $derived(
    settings
      .map(({ title, items }) => {
        const query = searchQuery.toLowerCase();
        return {
          title,
          items: items.filter(
            ({ title, subtitle }) => title.toLowerCase().includes(query) || subtitle.toLowerCase().includes(query),
          ),
        };
      })
      .filter(({ items }) => items.length > 0),
  );
</script>

<CommandPaletteContext commands={[CopyToClipboard, Upload, Download]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[CopyToClipboard, Download, Upload]}>
  <section class="flex place-content-center sm:px-4 mt-4">
    <section class="w-full pb-28">
      <Container size="medium" center>
        {#if featureFlagsManager.value.configFile}
          <Alert color="warning" class="text-dark my-4" title={$t('admin.config_set_by_file')} />
        {/if}

        <div class="mb-4">
          <SearchBar placeholder={$t('search_settings')} bind:name={searchQuery} showLoadingSpinner={false} />
        </div>

        <div class="flex flex-col gap-8">
          {#each filteredGroups as { title, items } (title)}
            <div>
              <Card color="secondary">
                <CardHeader class="px-5 py-3">
                  <CardTitle>
                    <Text color="primary" fontWeight="semi-bold">{title}</Text>
                  </CardTitle>
                </CardHeader>
                <div>
                  {#each items as { title, subtitle, href, icon }, i (i)}
                    <Button
                      variant="outline"
                      shape="rectangle"
                      color="secondary"
                      class="flex justify-between border-subtle"
                      {href}
                    >
                      <div class="flex flex-col items-start">
                        <Text fontWeight="semi-bold" class="flex items-center gap-2">
                          <!-- <Icon {icon} /> -->
                          {title}
                        </Text>
                        <Text class="line-clamp-1" color="muted">{subtitle}</Text>
                      </div>
                      <Icon icon={mdiPencilOutline} size="1.25rem" />
                    </Button>
                  {/each}
                </div>
              </Card>
            </div>
          {/each}
        </div>
      </Container>
    </section>
  </section>
</AdminPageLayout>

{@render children?.()}
