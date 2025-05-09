<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { Mesh, PerspectiveCamera, Scene, VideoTexture, WebGLRenderer } from 'three';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  // Format duration from seconds to MM:SS
  function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Video control states
  let isPlaying = $state(false);
  let currentTimeState = $state(0);
  let duration = $state(0);
  let volume = $state(1);
  let buffered = $state<TimeRanges | null>(null);

  interface Props {
    videoUrl: string;
    onClose: () => void;
    currentTime?: number;
  }

  const { videoUrl, onClose, currentTime = 0 }: Props = $props();

  // Video control functions
  function togglePlay() {
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      void video.play();
    }
  }

  function updateTime(newTime: number) {
    if (!video) return;
    video.currentTime = newTime;
  }

  function updateVolume(newVolume: number) {
    if (!video) return;
    volume = newVolume;
    video.volume = newVolume;
  }

  function getBufferedRanges(): { start: number; end: number }[] {
    if (!video || !video.buffered) return [];
    const ranges = [];
    for (let i = 0; i < video.buffered.length; i++) {
      ranges.push({
        start: video.buffered.start(i),
        end: video.buffered.end(i),
      });
    }
    return ranges;
  }

  let canvasContainer: HTMLDivElement | undefined = $state();
  let isLoading = $state(true);
  let video: HTMLVideoElement | null = null;

  // Three.js variables
  let camera: PerspectiveCamera | null = null;
  let scene: Scene | null = null;
  let renderer: WebGLRenderer | null = null;
  let videoTexture: VideoTexture | null = null;
  let sphere: Mesh | null = null;
  let xrSession: XRSession | null = null;

  // State for timeline dragging
  let isDragging = $state(false);
  let previewTime = $state<number | null>(null);

  function handleTimelineMouseMove(e: MouseEvent & { currentTarget: HTMLDivElement }) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    previewTime = pos * duration;
  }

  function handleTimelineDragStart(e: MouseEvent) {
    isDragging = true;
  }

  function handleTimelineDragEnd() {
    isDragging = false;
  }

  function handleTimelineMouseLeave() {
    if (!isDragging) {
      previewTime = null;
    }
  }

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

    try {
      const videoElement = document.createElement('video');
      videoElement.preload = 'auto'; // Maximum preload
      videoElement.src = videoUrl;
      videoElement.crossOrigin = 'anonymous';
      videoElement.loop = true;
      videoElement.muted = false;

      // Buffering settings
      if ('bufferingRate' in videoElement) {
        // @ts-ignore - Experimental property
        videoElement.bufferingRate = 1.0; // Maximum buffering rate
      }

      // Force preload attempt
      videoElement.load();

      video = videoElement;

      // Set initial time after metadata is loaded
      videoElement.addEventListener(
        'loadedmetadata',
        async () => {
          // Attempt to load the entire video file
          try {
            // First seek to the end of video for loading
            videoElement.currentTime = videoElement.duration;
            // Wait a bit for buffering to start
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Return to requested time
            videoElement.currentTime = currentTime;
          } catch (error) {
            console.error('Error during video preloading:', error);
            videoElement.currentTime = currentTime;
          }
        },
        { once: true },
      );

      // Create video texture
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBAFormat;

      // Create inverted sphere for panorama
      const geometry = new THREE.SphereGeometry(5, 60, 40);
      geometry.scale(-1, 1, 1); // Invert so the video is on the inside

      const material = new THREE.MeshBasicMaterial({ map: videoTexture });
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
            if (video) {
              video.pause();
            }
            xrSession = null;
            onClose();
          });
        }

        // Start rendering loop
        if (scene && camera && renderer && video) {
          // Add video event listeners
          const videoElement = video; // Create a local reference to satisfy TypeScript

          // Event listeners for video state
          videoElement.addEventListener('play', () => (isPlaying = true));
          videoElement.addEventListener('pause', () => (isPlaying = false));
          videoElement.addEventListener('timeupdate', () => (currentTimeState = videoElement.currentTime));

          // Event listeners for metadata and buffering
          videoElement.addEventListener('loadedmetadata', () => {
            duration = videoElement.duration;
          });

          videoElement.addEventListener('loadeddata', () => {
            duration = videoElement.duration;
            currentTimeState = videoElement.currentTime;
            buffered = videoElement.buffered;
          });

          videoElement.addEventListener('progress', () => {
            buffered = videoElement.buffered;
            const ranges = getBufferedRanges();
          });

          videoElement.addEventListener('durationchange', () => {
            duration = videoElement.duration;
          });

          // Start playback
          await videoElement.play();
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
      console.error('Error setting up video texture:', error);
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

    // Pause and cleanup video
    if (video) {
      video.pause();
      video.src = '';
      video.load();
    }

    // Cleanup Three.js resources
    if (renderer) {
      renderer.setAnimationLoop(null);
      renderer.dispose();
    }
    if (videoTexture) videoTexture.dispose();
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
    video = null;
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

    <!-- Video Controls -->
    <div class="absolute bottom-0 left-0 right-0 z-50 p-4 text-white">
      <div class="rounded bg-black/50 p-2">
        <!-- Timeline -->
        <div
          role="slider"
          tabindex="0"
          aria-label="Video progress"
          aria-valuemin="0"
          aria-valuemax={duration}
          aria-valuenow={currentTimeState}
          class="group relative mb-1 h-2 cursor-pointer rounded bg-gray-600"
          onmousedown={handleTimelineDragStart}
          onmouseup={handleTimelineDragEnd}
          onmouseleave={handleTimelineMouseLeave}
          onmousemove={(e: MouseEvent & { currentTarget: HTMLDivElement }) => {
            handleTimelineMouseMove(e);
            if (isDragging) {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              updateTime(pos * duration);
            }
          }}
          onclick={(e: MouseEvent & { currentTarget: HTMLDivElement }) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            updateTime(pos * duration);
          }}
          onkeydown={(e) => {
            if (e.key === 'ArrowRight') {
              updateTime(Math.min(currentTimeState + 5, duration));
            } else if (e.key === 'ArrowLeft') {
              updateTime(Math.max(currentTimeState - 5, 0));
            }
          }}
        >
          <!-- Buffered ranges -->
          {#if buffered}
            {#each getBufferedRanges() as range}
              <div
                class="absolute h-full bg-gray-400"
                style="left: {(range.start / duration) * 100}%; width: {((range.end - range.start) / duration) * 100}%"
              ></div>
            {/each}
          {/if}
          <!-- Progress -->
          <div class="absolute h-full bg-white" style="width: {(currentTimeState / duration) * 100}%"></div>
          <!-- Hover preview -->
          <div class="invisible absolute h-full w-full group-hover:visible">
            <div
              class="absolute -top-6 flex flex-col items-center"
              style="left: {((previewTime ?? currentTimeState) / duration) * 100}%"
            >
              <span class="mb-1 rounded bg-black/75 px-2 py-1 text-xs">
                {formatDuration(previewTime ?? currentTimeState)}
              </span>
              <div class="h-6 w-0.5 bg-white opacity-50"></div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <!-- Play/Pause and time -->
          <div class="flex items-center gap-4">
            <button type="button" class="focus:outline-none" onclick={togglePlay}>
              {#if isPlaying}
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              {:else}
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              {/if}
            </button>
            <span class="text-sm">
              {formatDuration(currentTimeState)} / {formatDuration(duration)}
            </span>
          </div>

          <!-- Volume control -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="focus:outline-none"
              onclick={() => updateVolume(volume === 0 ? 1 : 0)}
              aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {#if volume === 0}
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"
                  />
                </svg>
              {:else}
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                  />
                </svg>
              {/if}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="w-20"
              value={volume}
              oninput={(e) => updateVolume(parseFloat(e.currentTarget.value))}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
