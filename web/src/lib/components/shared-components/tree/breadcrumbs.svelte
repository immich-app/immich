<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { IconButton } from '@immich/ui';
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
      <IconButton
        shape="round"
        color="secondary"
        variant="ghost"
        icon={mdiArrowUpLeft}
        aria-label={$t('to_parent')}
        href={getLink(pathSegments.slice(0, -1).join('/'))}
        class="me-2"
        onclick={() => {}}
      />
    </div>
  {/if}

  <div
    class="bg-gray-50 dark:bg-immich-dark-gray/50 w-full p-2 rounded-2xl border border-gray-100 dark:border-gray-900 overflow-y-auto immich-scrollbar"
  >
    <ol class="flex gap-2 items-center">
      <li>
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          {icon}
          href={getLink('')}
          aria-label={title}
          size="medium"
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
