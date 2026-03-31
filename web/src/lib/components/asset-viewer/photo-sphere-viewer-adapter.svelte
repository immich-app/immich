<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import AssetViewerEvents from '$lib/components/AssetViewerEvents.svelte';
  import { assetViewerManager, type Faces } from '$lib/managers/asset-viewer-manager.svelte';
  import { ocrManager, type OcrBoundingBox } from '$lib/stores/ocr.svelte';
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { calculateBoundingBoxMatrix, getOcrBoundingBoxes, type Point } from '$lib/utils/ocr-utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import {
    EquirectangularAdapter,
    Viewer,
    events,
    type AdapterConstructor,
    type PluginConstructor,
  } from '@photo-sphere-viewer/core';
  import '@photo-sphere-viewer/core/index.css';
  import { MarkersPlugin, events as markerEvents } from '@photo-sphere-viewer/markers-plugin';
  import '@photo-sphere-viewer/markers-plugin/index.css';
  import { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';
  import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
  import '@photo-sphere-viewer/settings-plugin/index.css';
  import { escape } from 'lodash-es';
  import { onDestroy, onMount } from 'svelte';

  const FACE_MARKER_PREFIX = 'face_';
  const OCR_MARKER_PREFIX = 'box_';

  // Transparent, invisible hit target for hoverable face bounding boxes
  const FACE_BOX_DEFAULT_SVG_STYLE = {
    fill: 'rgba(0, 0, 0, 0)',
    stroke: 'rgba(0, 0, 0, 0)',
    strokeWidth: '0',
  };

  // Adapted as well as possible from classlist 'border-solid border-white border-3 rounded-lg'
  const FACE_BOX_HIGHLIGHTED_SVG_STYLE = {
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
    asset?: AssetResponseDto;
    adapter?: AdapterConstructor | [AdapterConstructor, unknown];
    plugins?: (PluginConstructor | [PluginConstructor, unknown])[];
    navbar?: boolean;
  };

  let {
    panorama,
    originalPanorama,
    asset,
    adapter = EquirectangularAdapter,
    plugins = [],
    navbar = false,
  }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let viewer: Viewer;
  let viewerReady = $state(false);

  let animationInProgress: { cancel: () => void } | undefined;
  let isHighlightFromSphere = false;

  const faces = $derived.by(() => {
    const result: Faces[] = [];
    for (const person of asset?.people ?? []) {
      if (person.isHidden && !assetViewerManager.isShowingHiddenPeople) {
        continue;
      }
      for (const face of person.faces ?? []) {
        result.push(face);
      }
    }
    return result;
  });

  const getTextureWidth = () => {
    if (!viewer?.state.textureData) {
      return 0;
    }
    return viewer.state.textureData.panoData.croppedWidth;
  };

  const facePolygonPixels = (face: Faces, textureWidth: number): [number, number][] => {
    const { boundingBoxX1: x1, boundingBoxY1: y1, boundingBoxX2: x2, boundingBoxY2: y2 } = face;
    const ratio = textureWidth / face.imageWidth;
    return [
      [x1 * ratio, y1 * ratio],
      [x2 * ratio, y1 * ratio],
      [x2 * ratio, y2 * ratio],
      [x1 * ratio, y2 * ratio],
    ];
  };

  let activeFaceMarkerIds = new Set<string>();

  // Add/remove face markers when the face set changes (does not touch styles)
  $effect(() => {
    const currentFaces = faces;

    if (!viewerReady || !viewer || !viewer.state.textureData || !viewer.getPlugin(MarkersPlugin)) {
      return;
    }
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
    const textureWidth = getTextureWidth();
    const desiredIds = new Set(currentFaces.map((f) => `${FACE_MARKER_PREFIX}${f.id}`));

    // Remove markers that are no longer in the face set
    for (const id of activeFaceMarkerIds) {
      if (!desiredIds.has(id)) {
        markersPlugin.removeMarker(id);
      }
    }

    // Add markers that are new
    for (const face of currentFaces) {
      const id = `${FACE_MARKER_PREFIX}${face.id}`;
      if (!activeFaceMarkerIds.has(id)) {
        markersPlugin.addMarker({
          id,
          polygonPixels: facePolygonPixels(face, textureWidth),
          svgStyle: FACE_BOX_DEFAULT_SVG_STYLE,
        });
      }
    }

    activeFaceMarkerIds = desiredIds;
  });

  // Update highlight styles and animate (does not add/remove markers)
  $effect(() => {
    const highlightedFaces = assetViewerManager.highlightedFaces;

    if (animationInProgress) {
      animationInProgress.cancel();
      animationInProgress = undefined;
    }
    if (!viewerReady || !viewer || !viewer.state.textureData || !viewer.getPlugin(MarkersPlugin)) {
      return;
    }
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
    const highlightedIds = new Set(highlightedFaces.map((f) => f.id));

    // Update styles on existing face markers
    for (const id of activeFaceMarkerIds) {
      const faceId = id.slice(FACE_MARKER_PREFIX.length);
      markersPlugin.updateMarker({
        id,
        svgStyle: highlightedIds.has(faceId) ? FACE_BOX_HIGHLIGHTED_SVG_STYLE : FACE_BOX_DEFAULT_SVG_STYLE,
      });
    }

    // Only animate when the highlight came from outside the sphere (e.g. detail panel hover)
    if (isHighlightFromSphere) {
      isHighlightFromSphere = false;
    } else if (highlightedFaces.length === 1) {
      const textureWidth = getTextureWidth();
      const {
        boundingBoxX1: x1,
        boundingBoxY1: y1,
        boundingBoxX2: x2,
        boundingBoxY2: y2,
        imageWidth: w,
      } = highlightedFaces[0];
      const ratio = textureWidth / w;
      const x = ((x1 + x2) * ratio) / 2;
      const y = ((y1 + y2) * ratio) / 2;
      animationInProgress = viewer.animate({
        textureX: x,
        textureY: y,
        zoom: Math.min(viewer.getZoomLevel(), 75),
        speed: 500,
      });
    }
  });

  $effect(() => {
    updateOcrBoxes(ocrManager.showOverlay, ocrManager.data);
  });

  const clearOcrMarkers = (markersPlugin: MarkersPlugin) => {
    for (const marker of markersPlugin.getMarkers()) {
      if (marker.id.startsWith(OCR_MARKER_PREFIX)) {
        markersPlugin.removeMarker(marker.id);
      }
    }
  };

  /** Use updateOnly=true on zoom, pan, or resize. */
  const updateOcrBoxes = (showOverlay: boolean, ocrData: OcrBoundingBox[], updateOnly = false) => {
    if (!viewer || !viewer.state.textureData || !viewer.getPlugin(MarkersPlugin)) {
      return;
    }
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
    if (!showOverlay) {
      clearOcrMarkers(markersPlugin);
      return;
    }
    if (!updateOnly) {
      clearOcrMarkers(markersPlugin);
    }

    const boxes = getOcrBoundingBoxes(ocrData, {
      width: viewer.state.textureData.panoData.croppedWidth,
      height: viewer.state.textureData.panoData.croppedHeight,
    });

    for (const [index, box] of boxes.entries()) {
      const points = box.points.map((p) => texturePointToViewerPoint(viewer, p));
      const { matrix, width, height } = calculateBoundingBoxMatrix(points);

      const fontSize = (1.4 * width) / box.text.length; // fits almost all strings within the box, depends on font family
      const transform = `matrix3d(${matrix.join(',')})`;
      const content = `<div class="${OCR_TOOLTIP_HTML_CLASS}" style="font-size: ${fontSize}px; width: ${width}px; height: ${height}px; transform: ${transform}; transform-origin: 0 0;">${escape(box.text)}</div>`;

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

    const onReadyHandler = () => {
      viewerReady = true;
      updateOcrBoxes(ocrManager.showOverlay, ocrManager.data, false);
    };
    const updateHandler = () => updateOcrBoxes(ocrManager.showOverlay, ocrManager.data, true);
    viewer.addEventListener(events.ReadyEvent.type, onReadyHandler);
    viewer.addEventListener(events.PositionUpdatedEvent.type, updateHandler);
    viewer.addEventListener(events.SizeUpdatedEvent.type, updateHandler);
    viewer.addEventListener(events.ZoomUpdatedEvent.type, updateHandler, { passive: true });

    // Face marker hover events
    const markersPlugin = viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
    const onEnterMarker = (event: markerEvents.EnterMarkerEvent) => {
      if (!event.marker.id.startsWith(FACE_MARKER_PREFIX)) {
        return;
      }
      const faceId = event.marker.id.slice(FACE_MARKER_PREFIX.length);
      const face = faces.find((f) => f.id === faceId);
      if (face) {
        isHighlightFromSphere = true;
        assetViewerManager.setHighlightedFaces([face]);
      }
    };
    const onLeaveMarker = (event: markerEvents.LeaveMarkerEvent) => {
      if (!event.marker.id.startsWith(FACE_MARKER_PREFIX)) {
        return;
      }
      isHighlightFromSphere = true;
      assetViewerManager.clearHighlightedFaces();
    };
    markersPlugin.addEventListener(markerEvents.EnterMarkerEvent.type, onEnterMarker);
    markersPlugin.addEventListener(markerEvents.LeaveMarkerEvent.type, onLeaveMarker);

    return () => {
      viewer.removeEventListener(events.ReadyEvent.type, onReadyHandler);
      viewer.removeEventListener(events.PositionUpdatedEvent.type, updateHandler);
      viewer.removeEventListener(events.SizeUpdatedEvent.type, updateHandler);
      viewer.removeEventListener(events.ZoomUpdatedEvent.type, updateHandler);
      viewer.removeEventListener(events.ZoomUpdatedEvent.type, zoomHandler);
      markersPlugin.removeEventListener(markerEvents.EnterMarkerEvent.type, onEnterMarker);
      markersPlugin.removeEventListener(markerEvents.LeaveMarkerEvent.type, onLeaveMarker);
    };
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
    assetViewerManager.clearHighlightedFaces();
    assetViewerManager.hideHiddenPeople();
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
