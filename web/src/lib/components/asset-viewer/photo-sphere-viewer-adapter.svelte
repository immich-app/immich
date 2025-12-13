<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { boundingBoxesArray, type Faces } from '$lib/stores/people.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import {
    EquirectangularAdapter,
    Viewer,
    events,
    type AdapterConstructor,
    type PluginConstructor,
  } from '@photo-sphere-viewer/core';
  import '@photo-sphere-viewer/core/index.css';
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

  type Props = {
    panorama: string | { source: string };
    originalPanorama?: string | { source: string };
    adapter?: AdapterConstructor | [AdapterConstructor, unknown];
    plugins?: (PluginConstructor | [PluginConstructor, unknown])[];
    navbar?: boolean;
    zoomToggle?: (() => void) | null;
  };

  let {
    panorama,
    originalPanorama,
    adapter = EquirectangularAdapter,
    plugins = [],
    navbar = false,
    zoomToggle = $bindable(),
  }: Props = $props();

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

  zoomToggle = () => {
    if (!viewer) {
      return;
    }
    viewer.animate({ zoom: $photoZoomState.currentZoom > 1 ? 50 : 83.3, speed: 250 });
  };

  let hasChangedResolution: boolean = false;
  onMount(() => {
    if (!container) {
      return;
    }

    viewer = new Viewer({
      adapter,
      plugins: [
        MarkersPlugin,
        SettingsPlugin,
        [
          ResolutionPlugin,
          {
            defaultResolution: $alwaysLoadOriginalFile && originalPanorama ? 'original' : 'default',
            resolutions: [
              {
                id: 'default',
                label: 'Default',
                panorama,
              },
              ...(originalPanorama
                ? [
                    {
                      id: 'original',
                      label: 'Original',
                      panorama: originalPanorama,
                    },
                  ]
                : []),
            ],
          },
        ],
        ...plugins,
      ],
      container,
      touchmoveTwoFingers: false,
      mousewheelCtrlKey: false,
      navbar,
      minFov: 15,
      maxFov: 90,
      zoomSpeed: 0.5,
      fisheye: false,
    });
    const resolutionPlugin = viewer.getPlugin<ResolutionPlugin>(ResolutionPlugin);
    const zoomHandler = ({ zoomLevel }: events.ZoomUpdatedEvent) => {
      // zoomLevel range: [0, 100]
      photoZoomState.set({
        ...$photoZoomState,
        currentZoom: zoomLevel / 50,
      });

      if (Math.round(zoomLevel) >= 75 && !hasChangedResolution) {
        // Replace the preview with the original
        void resolutionPlugin.setResolution('original');
        hasChangedResolution = true;
      }
    };

    if (originalPanorama && !$alwaysLoadOriginalFile) {
      viewer.addEventListener(events.ZoomUpdatedEvent.type, zoomHandler, { passive: true });
    }

    return () => viewer.removeEventListener(events.ZoomUpdatedEvent.type, zoomHandler);
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
    boundingBoxesUnsubscribe();
    // zoomHandler is not called on initial load. Viewer initial zoom is 1, but photoZoomState could be != 1.
    photoZoomState.set({
      ...$photoZoomState,
      currentZoom: 1,
    });
  });
</script>

<svelte:document use:shortcuts={[{ shortcut: { key: 'z' }, onShortcut: zoomToggle, preventDefault: true }]} />
<div class="h-full w-full mb-0" bind:this={container}></div>
