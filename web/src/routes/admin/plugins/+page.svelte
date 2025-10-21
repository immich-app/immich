<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import { Button, Icon, Switch } from '@immich/ui';
  import { mdiCheckDecagram, mdiWrench } from '@mdi/js';
  import { range } from 'lodash-es';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  const { data }: Props = $props();

  const plugins = range(0, 8).map((index) => ({
    name: `Plugin-${index}`,
    description: `Plugin ${index} is awesome because it can do x and even y!`,
    isEnabled: Math.random() < 0.5,
    isInstalled: Math.random() < 0.5,
    isOfficial: Math.random() < 0.5,
    version: 1,
  }));
</script>

<AdminPageLayout title={data.meta.title}>
  {#snippet buttons()}
    <div class="flex gap-2 items-center justify-center">
      <Button leadingIcon={mdiWrench} onclick={() => console.log('clicked')}>Test</Button>
    </div>
  {/snippet}

  <section id="setting-content" class="flex place-content-center sm:mx-4">
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {#each plugins as plugin, i (i)}
        <section
          class="flex flex-col gap-4 justify-between dark:bg-immich-dark-gray bg-immich-gray dark:border-0 border-gray-200 border border-solid rounded-2xl p-4"
        >
          <div class="flex flex-col gap-2">
            <h1 class="m-0 items-start flex gap-2">
              {plugin.name}
              {#if plugin.isOfficial}
                <Icon icon={mdiCheckDecagram} size="18" class="text-success" />
              {/if}
              <div class="place-self-end justify-self-end justify-end self-end">Version {plugin.version}</div>
            </h1>

            <p class="m-0 text-sm text-gray-600 dark:text-gray-300">{plugin.description}</p>
          </div>
          <div class="flex">Is {plugin.isInstalled ? '' : 'not '}installed</div>
          <Switch checked={plugin.isEnabled} id={plugin.name} title="Enabled" />
        </section>
      {/each}
    </div>
  </section>
</AdminPageLayout>
