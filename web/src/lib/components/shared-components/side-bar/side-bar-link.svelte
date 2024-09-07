<script lang="ts">
  import { resolveRoute } from '$app/paths';
  import { page } from '$app/stores';
  import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';

  export let title: string;
  export let routeId: string;
  export let icon: string;
  export let flippedLogo = false;
  export let isSelected = false;
  export let preloadData = true;

  $: routePath = resolveRoute(routeId, {});
  $: isSelected = ($page.route.id?.match(/^\/(admin|\(user\))\/[^/]*/) || [])[0] === routeId;
</script>

<a
  href={routePath}
  data-sveltekit-preload-data={preloadData ? 'hover' : 'off'}
  draggable="false"
  aria-current={isSelected ? 'page' : undefined}
>
  <SideBarButton {title} {icon} {flippedLogo} {isSelected} moreInformation={$$slots.moreInformation}>
    <slot name="moreInformation" slot="moreInformation" />
  </SideBarButton>
</a>
