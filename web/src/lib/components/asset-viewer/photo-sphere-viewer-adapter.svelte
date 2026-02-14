<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import AssetViewerEvents from '$lib/components/AssetViewerEvents.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { ocrManager, type OcrBoundingBox } from '$lib/stores/ocr.svelte';
  import { boundingBoxesArray, type Faces } from '$lib/stores/people.store';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { calculateBoundingBoxMatrix, getOcrBoundingBoxesAtSize, type Point } from '$lib/utils/ocr-utils';
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

  // Adapted as well as possible from classlist 'border-2 border-blue-500 bg-blue-500/10 hover:border-blue-600 hover:border-3'
  const OCR_BOX_SVG_STYLE = {
    fill: 'var(--color-blue-500)',
    fillOpacity: '0.1',
    stroke: 'var(--color-blue-500)',
    strokeWidth: '2px',
  };

  const OCR_TOOLTIP_HTML_CLASS =
    'flex items-center justify-center text-white bg-black/50 cursor-text pointer-events-auto whitespace-pre-wrap wrap-break-word select-text';

  type Props = {
    panorama: string | { source: string };
    originalPanorama?: string | { source: string };
    adapter?: AdapterConstructor | [AdapterConstructor, unknown];
    plugins?: (PluginConstructor | [PluginConstructor, unknown])[];
    navbar?: boolean;
  };

  let { panorama, originalPanorama, adapter = EquirectangularAdapter, plugins = [], navbar = false }: Props = $props();

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

  $effect(() => {
    updateOcrBoxes(ocrManager.showOverlay, ocrManager.data);
  });

  /** Use updateOnly=true on zoom, pan, or resize. */
  const updateOcrBoxes = (showOverlay: boolean, ocrData: OcrBoundingBox[], updateOnly = false) => {
    if (!viewer || !viewer.state.textureData || !viewer.getPlugin(MarkersPlugin)) {
      return;
    }
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
    if (!showOverlay) {
      markersPlugin.clearMarkers();
      return;
    }
    if (!updateOnly) {
      markersPlugin.clearMarkers();
    }

    const boxes = getOcrBoundingBoxesAtSize(ocrData, {
      width: viewer.state.textureData.panoData.croppedWidth,
      height: viewer.state.textureData.panoData.croppedHeight,
    });

    for (const [index, box] of boxes.entries()) {
      const points = box.points.map((p) => texturePointToViewerPoint(viewer, p));
      const { matrix, width, height } = calculateBoundingBoxMatrix(points);

      const fontSize = (1.4 * width) / box.text.length; // fits almost all strings within the box, depends on font family
      const transform = `matrix3d(${matrix.join(',')})`;
      const content = `<div class="${OCR_TOOLTIP_HTML_CLASS}" style="font-size: ${fontSize}px; width: ${width}px; height: ${height}px; transform: ${transform}; transform-origin: 0 0;">${box.text}</div>`;

      if (updateOnly) {
        markersPlugin.updateMarker({
          id: `box_${index}`,
          polygonPixels: box.points.map((b) => [b.x, b.y]),
          tooltip: { content },
        });
      } else {
        markersPlugin.addMarker({
          id: `box_${index}`,
          polygonPixels: box.points.map((b) => [b.x, b.y]),
          svgStyle: OCR_BOX_SVG_STYLE,
          tooltip: { content, trigger: 'click' },
        });
      }
    }
  };

  const texturePointToViewerPoint = (viewer: Viewer, point: Point) => {
    const spherical = viewer.dataHelper.textureCoordsToSphericalCoords({ textureX: point.x, textureY: point.y });
    return viewer.dataHelper.sphericalCoordsToViewerCoords(spherical);
  };

  const onZoom = () => {
    viewer?.animate({ zoom: assetViewerManager.zoom > 1 ? 50 : 83.3, speed: 250 });
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
      // zoomLevel is 0-100
      assetViewerManager.zoom = zoomLevel / 50;

      if (Math.round(zoomLevel) >= 75 && !hasChangedResolution) {
        // Replace the preview with the original
        void resolutionPlugin.setResolution('original');
        hasChangedResolution = true;
      }
    };

    if (originalPanorama && !$alwaysLoadOriginalFile) {
      viewer.addEventListener(events.ZoomUpdatedEvent.type, zoomHandler, { passive: true });
    }

    const onReadyHandler = () => updateOcrBoxes(ocrManager.showOverlay, ocrManager.data, false);
    const updateHandler = () => updateOcrBoxes(ocrManager.showOverlay, ocrManager.data, true);
    viewer.addEventListener(events.ReadyEvent.type, onReadyHandler);
    viewer.addEventListener(events.PositionUpdatedEvent.type, updateHandler);
    viewer.addEventListener(events.SizeUpdatedEvent.type, updateHandler);
    viewer.addEventListener(events.ZoomUpdatedEvent.type, updateHandler, { passive: true });

    return () => {
      viewer.removeEventListener(events.ReadyEvent.type, onReadyHandler);
      viewer.removeEventListener(events.PositionUpdatedEvent.type, updateHandler);
      viewer.removeEventListener(events.SizeUpdatedEvent.type, updateHandler);
      viewer.removeEventListener(events.ZoomUpdatedEvent.type, updateHandler);
      viewer.removeEventListener(events.ZoomUpdatedEvent.type, zoomHandler);
    };
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
    boundingBoxesUnsubscribe();
    assetViewerManager.zoom = 1;
  });
</script>

<AssetViewerEvents {onZoom} />

<svelte:document use:shortcuts={[{ shortcut: { key: 'z' }, onShortcut: onZoom, preventDefault: true }]} />
<div class="h-full w-full mb-0" bind:this={container}></div>

<style>
  /* Reset the default tooltip styling */
  :global(.psv-tooltip) {
    top: 0 !important;
    left: 0 !important;
    background: none;
    box-shadow: none;
    width: 0;
    height: 0;
  }

  :global(.psv-tooltip-content) {
    font: var(--font-normal);
    padding: 0;
    text-shadow: none;
  }

  :global(.psv-tooltip-arrow) {
    display: none;
  }
</style>
