<script lang="ts">
  import { boundingBoxesArray, type Faces } from '$lib/stores/people.store';
  import { EquirectangularAdapter, Viewer, type PluginConstructor } from '@photo-sphere-viewer/core';
  import '@photo-sphere-viewer/core/index.css';
  import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';
  import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
  import '@photo-sphere-viewer/markers-plugin/index.css';
  import { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';
  import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
  import '@photo-sphere-viewer/settings-plugin/index.css';
  import { onDestroy, onMount } from 'svelte';

  // Adapted as well as possible from classlist 'border-solid border-white border-3 rounded-lg'
  const FACE_BOX_SVG_STYLE = {
    fill: 'rgba(0, 0, 0, 0)',
    stroke: '#ffffff',
    strokeWidth: '3px',
    strokeLinejoin: 'round',
  };

  const SHARED_VIEWER_CONFIG = {
    touchmoveTwoFingers: false,
    mousewheelCtrlKey: false,
    navbar: false,
    minFov: 15,
    maxFov: 90,
    zoomSpeed: 0.5,
    fisheye: false,
  };

  type TileConfig = {
    width: number;
    cols: number;
    rows: number;
  };

  type Props = {
    baseUrl: string;
    tileUrl: ((col: number, row: number, level: number) => string | null) | undefined;
    tileconfig: TileConfig | undefined;
    plugins?: (PluginConstructor | [PluginConstructor, unknown])[];
  };

  let { baseUrl, tileUrl, tileconfig, plugins = [] }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let viewer: Viewer;

  let animationInProgress: { cancel: () => void } | undefined;
  let previousFaces: Faces[] = [];

  const boundingBoxesUnsubscribe = boundingBoxesArray.subscribe((faces: Faces[]) => {
    // Debounce; don't do anything when the data didn't actually change.
    if (faces === previousFaces) {
      return;
    }
    previousFaces = faces;

    if (animationInProgress) {
      animationInProgress.cancel();
      animationInProgress = undefined;
    }
    if (!viewer || !viewer.state.textureData || !viewer.getPlugin(MarkersPlugin)) {
      return;
    }
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);

    // croppedWidth is the size of the texture, which might be cropped to be less than 360/180 degrees.
    // This is what we want because the facial recognition is done on the image, not the sphere.
    const currentTextureWidth = viewer.state.textureData.panoData.croppedWidth;

    markersPlugin.clearMarkers();
    for (const [index, face] of faces.entries()) {
      const { boundingBoxX1: x1, boundingBoxY1: y1, boundingBoxX2: x2, boundingBoxY2: y2 } = face;
      const ratio = currentTextureWidth / face.imageWidth;
      // Pixel values are translated to spherical coordinates and only then added to the panorama;
      // no need to recalculate when the texture image changes to the original size.
      markersPlugin.addMarker({
        id: `face_${index}`,
        polygonPixels: [
          [x1 * ratio, y1 * ratio],
          [x2 * ratio, y1 * ratio],
          [x2 * ratio, y2 * ratio],
          [x1 * ratio, y2 * ratio],
        ],
        svgStyle: FACE_BOX_SVG_STYLE,
      });
    }

    // Smoothly pan to the highlighted (hovered-over) face.
    if (faces.length === 1) {
      const { boundingBoxX1: x1, boundingBoxY1: y1, boundingBoxX2: x2, boundingBoxY2: y2, imageWidth: w } = faces[0];
      const ratio = currentTextureWidth / w;
      const x = ((x1 + x2) * ratio) / 2;
      const y = ((y1 + y2) * ratio) / 2;
      animationInProgress = viewer.animate({
        textureX: x,
        textureY: y,
        zoom: Math.min(viewer.getZoomLevel(), 75),
        speed: 500, // duration in ms
      });
    }
  });

  onMount(() => {
    if (!container) {
      return;
    }

    viewer = tileconfig ? new Viewer({
        adapter: EquirectangularTilesAdapter,
        panorama: {
          ...tileconfig,
          baseUrl,
          tileUrl,
        },
        plugins: [
          MarkersPlugin,
          ...plugins,
        ],
        container,
        ...SHARED_VIEWER_CONFIG,
      }) : new Viewer({
        adapter: EquirectangularAdapter,
        panorama: baseUrl,
        plugins: [
          MarkersPlugin,
          ...plugins,
        ],
        container,
        ...SHARED_VIEWER_CONFIG,
      });
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
    boundingBoxesUnsubscribe();
  });
</script>

<div class="h-full w-full mb-0" bind:this={container}></div>
