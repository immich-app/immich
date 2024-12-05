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

  let key = getKey();
  let downloadUrl = window.location.origin + getBaseUrl() + `/assets/${asset.id}/original` + (key ? `?key=${key}` : '');
  let thumbUrl =
    window.location.origin + getBaseUrl() + `/assets/${asset.id}/thumbnail?size=thumbnail` + (key ? `&key=${key}` : '');

  const __onGCastApiAvailable = function (isAvailable: boolean) {
    if (isAvailable) {
      initializeCastApi();
    }
  };

  onMount(() => {
    if (window.chrome && !window.chrome.cast) {
      window['__onGCastApiAvailable'] = __onGCastApiAvailable;

      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.onload = () => {
        console.log('loaded cast from gstatic');
      };
      script.onerror = () => {
        console.error('failed to load cast from gstatic.');
      };
      document.body.appendChild(script);
    }
  });

  const initializeCastApi = function () {
    var options = {};

    // use the chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
    options.receiverApplicationId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;

    // ORIGIN_SCOPED - Auto connect from same appId and page origin
    options.autoJoinPolicy = chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED;

    cast.framework.CastContext.getInstance().setOptions(options);
  };

  const castAsset = async () => {
    // get or create session
    var castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    if (!castSession) {
      await cast.framework.CastContext.getInstance().requestSession();
      castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    }

    var mediaInfo = new chrome.cast.media.MediaInfo(downloadUrl, asset.originalMimeType);

    // for thumb and title
    mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
    mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
    mediaInfo.metadata.title = asset.originalFileName;
    mediaInfo.metadata.images = [{ url: thumbUrl }];

    var request = new chrome.cast.media.LoadRequest(mediaInfo);

    // cast content
    await castSession.loadMedia(request);
  };
</script>

<CircleIconButton onclick={castAsset} color="opaque" hideMobile={false} icon={mdiCast} title={'cast'} />
