<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { Mesh, PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  interface Props {
    imageUrl: string;
    onClose: () => void;
  }

  const { imageUrl, onClose }: Props = $props();

  let canvasContainer: HTMLDivElement | undefined = $state();
  let isLoading = $state(true);

  // Three.js variables
  let camera: PerspectiveCamera | null = null;
  let scene: Scene | null = null;
  let renderer: WebGLRenderer | null = null;
  let texture: Texture | null = null;
  let sphere: Mesh | null = null;
  let xrSession: XRSession | null = null;

  // Initialize Three.js scene with VR support
  const initThreeJs = async () => {
    if (!canvasContainer) return;

    const THREE = await import('three');

    scene = new THREE.Scene();

    // Camera in the center of the sphere
    camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.xr.enabled = true;
    canvasContainer.appendChild(renderer.domElement);

    // Load panorama texture
    const textureLoader = new THREE.TextureLoader();
    try {
      texture = await new Promise((resolve, reject) => {
        textureLoader.load(imageUrl, resolve, undefined, reject);
      });

      // Create inverted sphere for panorama
      const geometry = new THREE.SphereGeometry(5, 60, 40);
      geometry.scale(-1, 1, 1); // Invert so the image is on the inside

      const material = new THREE.MeshBasicMaterial({ map: texture });
      sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);

      // Start VR session
      try {
        if (navigator.xr) {
          xrSession = await navigator.xr.requestSession('immersive-vr', {
            optionalFeatures: ['local-floor', 'bounded-floor'],
          });
          await renderer?.xr.setSession(xrSession);

          xrSession.addEventListener('end', () => {
            xrSession = null;
            onClose();
          });
        }

        // Start rendering loop
        if (scene && camera && renderer) {
          renderer.setAnimationLoop(() => {
            if (!scene || !camera || !renderer) return;
            renderer.render(scene, camera);
          });
        }

        isLoading = false;
      } catch (error) {
        console.error('Failed to start VR session:', error);
        onClose();
      }
    } catch (error) {
      console.error('Error loading panorama texture:', error);
      onClose();
    }
  };

  onMount(async () => {
    try {
      if (!('xr' in navigator) || !navigator.xr) {
        throw new Error('WebXR not supported');
      }

      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      if (!supported) {
        throw new Error('VR not supported');
      }

      await initThreeJs();
    } catch (error) {
      console.error('VR initialization error:', error);
      onClose();
    }
  });

  onDestroy(() => {
    if (xrSession) {
      void xrSession.end().catch(console.error);
    }

    // Cleanup Three.js resources
    if (renderer) {
      renderer.setAnimationLoop(null);
      renderer.dispose();
    }
    if (texture) texture.dispose();
    if (sphere?.geometry) sphere.geometry.dispose();
    if (sphere?.material) {
      if (Array.isArray(sphere.material)) {
        sphere.material.forEach((mat) => mat.dispose());
      } else {
        sphere.material.dispose();
      }
    }

    scene = null;
    camera = null;
    renderer = null;
  });
</script>

<div
  transition:fade={{ duration: 150 }}
  class="fixed inset-0 z-50 flex select-none place-content-center place-items-center"
>
  <div bind:this={canvasContainer} class="h-full w-full">
    {#if isLoading}
      <div class="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    {/if}
  </div>
</div>
