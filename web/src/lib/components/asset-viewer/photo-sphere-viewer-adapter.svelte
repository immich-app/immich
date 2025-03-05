<script lang="ts">
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import {
    EquirectangularAdapter,
    Viewer,
    events,
    type AdapterConstructor,
    type PluginConstructor,
  } from '@photo-sphere-viewer/core';
  import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
  import { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';
  import '@photo-sphere-viewer/core/index.css';
  import '@photo-sphere-viewer/settings-plugin/index.css';
  import { onDestroy, onMount } from 'svelte';

  interface Props {
    panorama: string | { source: string };
    originalPanorama?: string | { source: string };
    adapter?: AdapterConstructor | [AdapterConstructor, unknown];
    plugins?: (PluginConstructor | [PluginConstructor, unknown])[];
    navbar?: boolean;
  }

  let { panorama, originalPanorama, adapter = EquirectangularAdapter, plugins = [], navbar = false }: Props = $props();

  let container: HTMLDivElement | undefined = $state();
  let viewer: Viewer;

  onMount(() => {
    if (!container) {
      return;
    }

    viewer = new Viewer({
      adapter,
      plugins: [
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
      minFov: 10,
      maxFov: 120,
      fisheye: false,
    });
    const resolutionPlugin = viewer.getPlugin(ResolutionPlugin) as ResolutionPlugin;

    if (originalPanorama && !$alwaysLoadOriginalFile) {
      const zoomHandler = ({ zoomLevel }: events.ZoomUpdatedEvent) => {
        // zoomLevel range: [0, 100]
        if (Math.round(zoomLevel) >= 75) {
          // Replace the preview with the original
          void resolutionPlugin.setResolution('original');
          viewer.removeEventListener(events.ZoomUpdatedEvent.type, zoomHandler);
        }
      };
      viewer.addEventListener(events.ZoomUpdatedEvent.type, zoomHandler);
    }
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
  });
</script>

<div class="h-full w-full mb-0" bind:this={container}></div>
