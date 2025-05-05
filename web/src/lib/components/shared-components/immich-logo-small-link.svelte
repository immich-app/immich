<script lang="ts">
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
</script>

<a data-sveltekit-preload-data="hover" class="ms-4" href="/">
  <ImmichLogo class="h-[50px] max-w-none md:w-auto md:max-w-full" noText={mobileDevice.maxMd} />
</a>
