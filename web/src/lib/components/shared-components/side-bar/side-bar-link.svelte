<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { resolveRoute } from '$app/paths';
  import { page } from '$app/stores';

  interface Props {
    title: string;
    routeId: string;
    icon: string;
    flippedLogo?: boolean;
    isSelected?: boolean;
    preloadData?: boolean;
  }

  let {
    title,
    routeId,
    icon,
    flippedLogo = false,
    isSelected = $bindable(false),
    preloadData = true,
  }: Props = $props();

  let routePath = $derived(resolveRoute(routeId, {}));

  $effect(() => {
    isSelected = ($page.route.id?.match(/^\/(admin|\(user\))\/[^/]*/) || [])[0] === routeId;
  });
</script>

<a
  href={routePath}
  data-sveltekit-preload-data={preloadData ? 'hover' : 'off'}
  draggable="false"
  aria-current={isSelected ? 'page' : undefined}
  class="flex w-full place-items-center gap-4 rounded-r-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-immich-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary
    {isSelected
    ? 'bg-immich-primary/10 text-immich-primary hover:bg-immich-primary/10 dark:bg-immich-dark-primary/10 dark:text-immich-dark-primary'
    : ''}
		pl-5 group-hover:sm:px-5 md:px-5
  "
>
  <div class="flex w-full place-items-center gap-4 overflow-hidden truncate">
    <Icon path={icon} size="1.5em" class="shrink-0" flipped={flippedLogo} ariaHidden />
    <span class="text-sm font-medium">{title}</span>
  </div>
  <div></div>
</a>
