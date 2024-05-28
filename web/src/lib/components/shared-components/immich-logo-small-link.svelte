<script lang="ts">
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';

  export let width: number;
</script>

<a data-sveltekit-preload-data="hover" class="ml-4" href="/">
  <ImmichLogo class="h-[24px] w-[24px] max-w-none md:w-auto md:h-10 md:max-w-full" noText={width < 768} />
</a>
