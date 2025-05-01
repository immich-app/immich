<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiArrowUpLeft, mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    pathSegments?: string[];
    getLink: (path: string) => string;
    title: string;
    icon: string;
  }

  let { pathSegments = [], getLink, title, icon }: Props = $props();

  let isRoot = $derived(pathSegments.length === 0);
</script>

<nav class="flex items-center py-2">
  {#if !isRoot}
    <div>
      <CircleIconButton
        icon={mdiArrowUpLeft}
        title={$t('to_parent')}
        href={getLink(pathSegments.slice(0, -1).join('/'))}
        class="me-2"
        padding="2"
        onclick={() => {}}
      />
    </div>
  {/if}

  <div
    class="bg-gray-50 dark:bg-immich-dark-gray/50 w-full p-2 rounded-2xl border border-gray-100 dark:border-gray-900 overflow-y-auto immich-scrollbar"
  >
    <ol class="flex gap-2 items-center">
      <li>
        <CircleIconButton
          {icon}
          href={getLink('')}
          {title}
          size="1.25em"
          padding="2"
          aria-current={isRoot ? 'page' : undefined}
          onclick={() => {}}
        />
      </li>
      {#each pathSegments as segment, index (index)}
        {@const isLastSegment = index === pathSegments.length - 1}
        <li
          class="flex gap-2 items-center font-mono text-sm text-nowrap text-immich-primary dark:text-immich-dark-primary"
        >
          <Icon path={mdiChevronRight} class="text-gray-500 dark:text-gray-300" size={16} ariaHidden />
          {#if isLastSegment}
            <p class="cursor-default whitespace-pre-wrap">{segment}</p>
          {:else}
            <a
              class="underline hover:font-semibold whitespace-pre-wrap"
              href={getLink(pathSegments.slice(0, index + 1).join('/'))}
            >
              {segment}
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  </div>
</nav>
