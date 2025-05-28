<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { Button } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight, mdiCheck } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t, type Translations } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    title?: Translations | undefined;
    icon?: string | undefined;
    children?: Snippet;
    previousTitle?: Translations | undefined;
    nextTitle?: Translations | undefined;
    onNext?: () => void;
    onPrevious?: () => void;
    onLeave?: () => void;
  }

  let {
    title = undefined,
    icon = undefined,
    children,
    previousTitle,
    nextTitle,
    onLeave,
    onNext,
    onPrevious,
  }: Props = $props();
</script>

<div
  id="onboarding-card"
  class="flex w-full max-w-4xl flex-col gap-4 rounded-3xl border-2 border-gray-500 px-8 py-8 dark:border-immich-dark-gray dark:bg-immich-dark-gray text-black dark:text-immich-dark-fg bg-gray-50"
  in:fade={{ duration: 250 }}
>
  {#if title || icon}
    <div class="flex gap-2 items-center justify-center w-fit">
      {#if icon}
        <Icon path={icon} size="30" class="text-immich-primary dark:text-immich-dark-primary" />
      {/if}
      {#if title}
        <p class="text-xl text-immich-primary dark:text-immich-dark-primary">
          {$t(title).toUpperCase()}
        </p>
      {/if}
    </div>
  {/if}
  {@render children?.()}

  <div class="flex pt-4">
    {#if previousTitle}
      <div class="w-full flex place-content-start">
        <Button
          shape="round"
          leadingIcon={mdiArrowLeft}
          class="flex gap-2 place-content-center"
          onclick={() => {
            onLeave?.();
            onPrevious?.();
          }}
        >
          <p>{$t(previousTitle)}</p>
        </Button>
      </div>
    {/if}

    <div class="flex w-full place-content-end">
      <Button
        shape="round"
        trailingIcon={nextTitle ? mdiArrowRight : mdiCheck}
        onclick={() => {
          onLeave?.();
          onNext?.();
        }}
      >
        <span class="flex place-content-center place-items-center gap-2">
          {$t(nextTitle ?? 'done')}
        </span>
      </Button>
    </div>
  </div>
</div>
