<script lang="ts">
  import type { VideoController } from '$lib/utils/video/controller.svelte';
  import { Icon } from '@immich/ui';
  import { mdiChevronLeft } from '@mdi/js';
  import 'media-chrome/menu/media-chrome-menu';
  import 'media-chrome/menu/media-chrome-menu-item';
  import { t } from 'svelte-i18n';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLElement> {
    video: VideoController;
  }

  let { video, ...rest }: Props = $props();

  const options = $derived(
    video.levels
      .map((level, idx) => ({ idx, label: Math.min(level.width, level.height) }))
      .sort((a, b) => b.label - a.label),
  );

  const autoLevel = $derived(video.selectedLevel === -1 ? options.find(({ idx }) => idx === video.level) : undefined);
  const autoLabel = $derived(autoLevel ? `${$t('media_chrome.auto')} (${autoLevel.label}p)` : $t('media_chrome.auto'));

  let menu = $state<HTMLElement>();
  $effect(() => {
    menu?.dispatchEvent(new CustomEvent('addmenuitem', { detail: autoLabel }));
  });

  const onChange = (event: Event) => {
    video.level = Number((event.currentTarget as HTMLElement & { value: string }).value);
  };
</script>

<media-chrome-menu bind:this={menu} {...rest} hidden onchange={onChange}>
  <Icon slot="back-icon" icon={mdiChevronLeft} class="m-2" />
  <span slot="title">{$t('video_quality')}</span>
  <media-chrome-menu-item part="menu-item radio" type="radio" value="-1" checked={video.selectedLevel === -1}>
    <span>{autoLabel}</span>
  </media-chrome-menu-item>
  {#each options as option (option.idx)}
    <media-chrome-menu-item
      part="menu-item radio"
      type="radio"
      value={`${option.idx}`}
      checked={video.selectedLevel === option.idx}
    >
      <span>{option.label}p</span>
    </media-chrome-menu-item>
  {/each}
</media-chrome-menu>

<style>
  media-chrome-menu-item {
    padding: 0.4em 0.8em 0.4em 1em;
  }
</style>
