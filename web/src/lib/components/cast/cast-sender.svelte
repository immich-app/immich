<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { getKey } from '$lib/utils';
  import { getBaseUrl, type AssetResponseDto } from '@immich/sdk';
  import { mdiCast } from '@mdi/js';
  import { onMount } from 'svelte';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset, ...rest }: Props = $props();

  let cjs;

  let key = getKey();
  let downloadUrl = window.location.origin + getBaseUrl() + `/assets/${asset.id}/original` + (key ? `?key=${key}` : '');
  let thumbUrl =
    window.location.origin + getBaseUrl() + `/assets/${asset.id}/thumbnail?size=thumbnail` + (key ? `&key=${key}` : '');

  onMount(() => {
    // Dynamically create a script tag to load Castjs
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/castjs/5.3.0/cast.min.js';
    script.onload = () => {
      // Initialize Castjs after the script is loaded
      if (typeof Castjs !== 'undefined') {
        cjs = new Castjs();
        console.log('Castjs loaded successfully.');
      } else {
        console.error('Castjs is still undefined after loading.');
      }
    };
    script.onerror = () => {
      console.error('Failed to load Castjs library.');
    };
    document.body.appendChild(script);
  });

  const castVideo = () => {
    if (cjs && cjs.available) {
      console.log(downloadUrl);
      cjs.cast(downloadUrl, {
        poster: thumbUrl,
        title: asset.originalFileName,
        description: 'casting from immich',
      });
    } else {
      console.error('Casting is unavailable.');
    }
  };
</script>

<CircleIconButton onclick={castVideo} color="opaque" hideMobile={false} icon={mdiCast} title={'cast'} />
