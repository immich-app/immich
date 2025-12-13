<script lang="ts">
  import { Button, Icon } from '@immich/ui';
  import { mdiArrowLeft, mdiArrowRight, mdiCheck } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    title?: string | undefined;
    icon?: string | undefined;
    children?: Snippet;
    previousTitle?: string | undefined;
    nextTitle?: string | undefined;
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
  class="flex w-full max-w-4xl flex-col gap-4 rounded-3xl border-2 border-gray-500 px-8 py-8 dark:border-gray-700 dark:bg-immich-dark-gray text-black dark:text-immich-dark-fg bg-gray-50"
  in:fade={{ duration: 250 }}
>
  {#if title || icon}
    <div class="flex gap-2 items-center justify-center w-fit">
      {#if icon}
        <Icon {icon} size="30" class="text-primary" />
      {/if}
      {#if title}
        <p class="uppercase text-xl text-primary">
          {title}
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
          <p>{previousTitle}</p>
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
          {nextTitle ?? $t('done')}
        </span>
      </Button>
    </div>
  </div>
</div>
