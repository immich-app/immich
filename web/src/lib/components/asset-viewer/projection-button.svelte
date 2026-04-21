<script lang="ts">
  import { panoramaFisheyeProjection } from '$lib/stores/preferences.store';
  import { IconButton } from '@immich/ui';
  import { mdiPanoramaSphereOutline, mdiPanoramaVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const onToggleProjection = () => {
    panoramaFisheyeProjection.update((value: boolean) => !value);
  };
</script>

<IconButton
  title={$panoramaFisheyeProjection ? $t('switch_to_planar_projection') : $t('switch_to_fisheye_projection')}
  icon={$panoramaFisheyeProjection ? mdiPanoramaVariantOutline : mdiPanoramaSphereOutline}
  class="dark"
  color="secondary"
  variant="ghost"
  shape="round"
  aria-label={$panoramaFisheyeProjection ? $t('fisheye_projection') : $t('planar_projection')}
  onclick={onToggleProjection}
/>
