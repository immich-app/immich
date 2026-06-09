<script lang="ts">
  import StatisticsTable from './StatisticsTable.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    cameras: Array<{
      make: string | null;
      model: string | null;
      count: number;
    }>;
    lenses: Array<{
      lensModel: string | null;
      count: number;
    }>;
    getCameraSearchUrl: (make: string | null, model: string | null) => string;
    getLensSearchUrl: (lensModel: string | null) => string;
  }

  let { cameras, lenses, getCameraSearchUrl, getLensSearchUrl }: Props = $props();

  const cameraItems = $derived.by(() =>
    cameras.map((camera) => ({
      label: `${camera.make ?? $t('unknown')} ${camera.model ?? ''}`.trim(),
      value: camera.count,
      href: getCameraSearchUrl(camera.make, camera.model),
    })),
  );

  const lensItems = $derived.by(() =>
    lenses.map((lens) => ({
      label: lens.lensModel ?? $t('unknown'),
      value: lens.count,
      href: getLensSearchUrl(lens.lensModel),
    })),
  );
</script>

<section class="grid items-stretch gap-6 xl:grid-cols-2">
  {#if cameras.length > 0}
    <StatisticsTable
      title={$t('top_cameras')}
      subtitle={`${$t('camera')} make/model pairs`}
      items={cameraItems}
      mainColumnLabel={$t('camera')}
    />
  {/if}

  {#if lenses.length > 0}
    <StatisticsTable
      title={$t('top_lenses')}
      subtitle={$t('lens_model')}
      items={lensItems}
      mainColumnLabel={$t('lens_model')}
    />
  {/if}
</section>
