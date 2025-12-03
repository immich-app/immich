<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as THREE from 'three';
  import { MapControls } from 'three/addons/controls/MapControls.js';

  interface Props {
    // Props
    imageUrl?: string;

    // Exported variables for external access
    imageWidth?: number;
    imageHeight?: number;
    zoomPercent?: number;
    cameraX?: number;
    cameraY?: number;
  }

  let {
    imageUrl = '',

    imageWidth = $bindable(0),
    imageHeight = $bindable(0),
    zoomPercent = $bindable(100),
    cameraX = $bindable(0),
    cameraY = $bindable(0),
  }: Props = $props();

  // Internal state
  let container: HTMLDivElement = $state();
  let canvas: HTMLCanvasElement = $state();
  let scene: THREE.Scene = $state();
  let camera: THREE.OrthographicCamera;
  let renderer: THREE.WebGLRenderer = $state();
  let controls: MapControls;
  let imageMesh: THREE.Mesh | null = null;
  let initialZoom: number = 1;
  let currentZoom: number = 1;

  // Reactive statements
  let canvasSize = $derived(
    container ? `${renderer?.domElement.width || 0} × ${renderer?.domElement.height || 0}` : 'Not initialized',
  );
  let imageDims = $derived(imageWidth && imageHeight ? `${imageWidth} × ${imageHeight}` : 'Not loaded');

  function initThreeJS() {
    if (!container || !canvas) {
      return;
    }

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x00_00_00);

    // Get initial canvas display size
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Create orthographic camera
    const aspect = width / height;
    const frustumSize = 1000;
    camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000,
    );
    camera.position.z = 10;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    // Pass false to prevent setting inline styles - CSS handles display size
    renderer.setSize(width, height, false);
    // Cap pixel ratio at 2 for performance (most displays are 1x or 2x)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Use sRGB color space for correct color rendering (matches browser's <img> behavior)
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Initialize MapControls - handles all pan/zoom/touch interactions
    controls = new MapControls(camera, canvas);
    controls.enableRotate = false; // Disable rotation for 2D viewing
    controls.zoomToCursor = true; // Zoom toward mouse cursor
    controls.screenSpacePanning = true; // Pan in screen space
    controls.minZoom = 0.1; // Will be updated after image loads
    controls.maxZoom = 20;
    controls.zoomSpeed = 3; // Faster zoom response (default is 1)
    controls.panSpeed = 3;
    controls.enableDamping = true; // Disable damping for instant response
    controls.dampingFactor = 0.1;

    // Configure mouse buttons - LEFT button only for panning
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: undefined, // Disable right-click to allow context menu
    };

    controls.addEventListener('change', () => {
      constrainPan(); // Constrain panning to keep image in viewport
      updateExportedVars();
    });
  }

  function checkAndHandleResize() {
    if (!canvas || !renderer || !camera) {
      return false;
    }

    // Get the actual display size of the canvas
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Check if the canvas drawing buffer size needs to be updated
    const needsResize = canvas.width !== width || canvas.height !== height;

    if (needsResize) {
      // Update the drawing buffer size to match display size
      // Pass false to prevent three.js from setting inline styles
      renderer.setSize(width, height, false);

      // Update camera aspect
      const aspect = width / height;
      const frustumSize = 1000;
      camera.left = (frustumSize * aspect) / -2;
      camera.right = (frustumSize * aspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();

      if (imageMesh && controls) {
        // Preserve the user's zoom level during resize
        const userZoomLevel = camera.zoom;

        // Recalculate the mesh scale to fit the new frustum
        const canvasAspect = width / height;
        const imageAspect = imageWidth / imageHeight;
        const newScale =
          imageAspect > canvasAspect
            ? (camera.right - camera.left) / imageWidth
            : (camera.top - camera.bottom) / imageHeight;

        // Update mesh scale to fit new viewport
        imageMesh.scale.set(newScale, newScale, 1);

        // Maintain user's zoom level
        camera.zoom = userZoomLevel;
        camera.updateProjectionMatrix();
      }
    }

    return needsResize;
  }

  function constrainPan() {
    if (!controls || !camera || !imageMesh) {
      return;
    }

    // Get bounding box of the image mesh in world space
    const bbox = new THREE.Box3().setFromObject(imageMesh);

    // Calculate the visible area based on camera frustum (adjusted for zoom)
    const viewWidth = (camera.right - camera.left) / camera.zoom;
    const viewHeight = (camera.top - camera.bottom) / camera.zoom;

    // Calculate image size in world space
    const imageWidth = bbox.max.x - bbox.min.x;
    const imageHeight = bbox.max.y - bbox.min.y;

    // Calculate pan limits
    // If image is smaller than view, center it (no panning)
    // If image is larger than view, allow panning to see all parts
    let minX, maxX, minY, maxY;

    if (imageWidth <= viewWidth) {
      // Image fits horizontally - center it
      minX = maxX = 0;
    } else {
      // Image is larger - allow panning within bounds
      const halfViewWidth = viewWidth / 2;
      minX = bbox.min.x + halfViewWidth;
      maxX = bbox.max.x - halfViewWidth;
    }

    if (imageHeight <= viewHeight) {
      // Image fits vertically - center it
      minY = maxY = 0;
    } else {
      // Image is larger - allow panning within bounds
      const halfViewHeight = viewHeight / 2;
      minY = bbox.min.y + halfViewHeight;
      maxY = bbox.max.y - halfViewHeight;
    }

    // Clamp the camera position within bounds
    camera.position.x = Math.max(minX, Math.min(maxX, camera.position.x));
    camera.position.y = Math.max(minY, Math.min(maxY, camera.position.y));

    // Clamp the controls target to match
    controls.target.x = camera.position.x;
    controls.target.y = camera.position.y;
  }

  function calculateInitialView() {
    if (!imageMesh || !container || !camera || !controls) {
      return;
    }

    const canvasAspect = container.clientWidth / container.clientHeight;
    const imageAspect = imageWidth / imageHeight;

    // Scale the mesh to fit within the frustum
    // The frustum is 1000 units, so scale image to fit within that
    let scale;
    scale =
      imageAspect > canvasAspect
        ? (camera.right - camera.left) / imageWidth
        : (camera.top - camera.bottom) / imageHeight;

    // Apply scale to mesh so it fits in the viewport at zoom=1
    imageMesh.scale.set(scale, scale, 1);

    initialZoom = 1;
    currentZoom = 1;

    // Reset camera zoom to 1 (mesh is already scaled to fit)
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    // Center camera and controls target
    camera.position.set(0, 0, 10);
    controls.target.set(0, 0, 0);
    controls.update();

    // Set minimum zoom to prevent zooming out beyond initial fit
    controls.minZoom = 1;

    updateExportedVars();
  }

  function loadImage(url: string) {
    if (!url || !scene) {
      return;
    }

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    textureLoader.load(
      url,
      function (texture) {
        imageWidth = texture.image.width;
        imageHeight = texture.image.height;

        // Configure texture for high quality zooming
        texture.minFilter = THREE.LinearFilter; // Smooth when zoomed out
        texture.magFilter = THREE.LinearFilter; // Smooth when zoomed in
        texture.colorSpace = THREE.SRGBColorSpace; // Use sRGB color space to match browser rendering
        texture.needsUpdate = true;

        // Remove old mesh if exists
        if (imageMesh) {
          scene.remove(imageMesh);
          imageMesh.geometry.dispose();
          (imageMesh.material as THREE.Material).dispose();
        }

        // Create plane geometry with image dimensions
        const geometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        });

        imageMesh = new THREE.Mesh(geometry, material);
        scene.add(imageMesh);

        calculateInitialView();
      },
      undefined,
      function (error) {
        console.error('Error loading image:', error);
      },
    );
  }

  function renderLoop() {
    if (!renderer || !scene || !camera || !controls) {
      return;
    }

    // Check and handle resize on every frame to prevent flickering
    checkAndHandleResize();

    // Update controls (handles damping/inertia)
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
  }

  function startRenderLoop() {
    if (!renderer) {
      return;
    }
    // Use Three.js's setAnimationLoop for better integration and XR support
    renderer.setAnimationLoop(renderLoop);
  }

  function stopRenderLoop() {
    if (!renderer) {
      return;
    }
    // Pass null to stop the animation loop
    renderer.setAnimationLoop(null);
  }

  function updateExportedVars() {
    if (!camera) {
      return;
    }
    // MapControls uses camera.zoom property
    zoomPercent = Math.round((camera.zoom / initialZoom) * 100);
    cameraX = Math.round(camera.position.x);
    cameraY = Math.round(camera.position.y);
  }

  export function resetView() {
    if (!camera || !controls) {
      return;
    }
    // Reset camera zoom and position
    camera.zoom = initialZoom;
    camera.position.set(0, 0, 10);
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.update();
  }

  // Custom keyboard shortcuts (MapControls handles arrow keys, +/-, etc.)
  function handleKeydown(e: KeyboardEvent) {
    if (!camera || !controls) {
      return;
    }

    switch (e.key) {
      case 'r':
      case 'R': {
        e.preventDefault();
        resetView();
        break;
      }
      // MapControls automatically handles: arrow keys for pan, +/- for zoom
    }
  }

  // Lifecycle
  onMount(() => {
    initThreeJS();

    if (imageUrl) {
      loadImage(imageUrl);
    }

    // Start the continuous render loop (handles resize checks automatically)
    startRenderLoop();

    // Keyboard events on document
    document.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    // Cleanup
    document.removeEventListener('keydown', handleKeydown);

    // Stop the render loop
    stopRenderLoop();

    // Dispose controls
    if (controls) {
      controls.dispose();
    }

    if (imageMesh) {
      imageMesh.geometry.dispose();
      (imageMesh.material as THREE.Material).dispose();
    }

    if (renderer) {
      renderer.dispose();
    }
  });

  // Watch for imageUrl changes
  $effect(() => {
    if (imageUrl && scene) {
      loadImage(imageUrl);
    }
  });
</script>

<div class="image-viewer-container h-full w-full" bind:this={container}>
  <!-- MapControls handles all mouse/touch interactions automatically -->
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .image-viewer-container {
    position: relative;
    background: #222;
    overflow: hidden;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: grab;
  }

  canvas:active {
    cursor: grabbing;
  }
</style>
