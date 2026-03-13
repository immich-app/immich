<script lang="ts">
  import type { SharedSpaceResponseDto } from '@immich/sdk';
  import {
    mdiAccountPlusOutline,
    mdiCheck,
    mdiChevronDown,
    mdiChevronRight,
    mdiChevronUp,
    mdiImageFilterHdrOutline,
    mdiImagePlusOutline,
  } from '@mdi/js';
  import { Icon } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    space: SharedSpaceResponseDto;
    gradientClass?: string;
    onAddPhotos: () => void;
    onInviteMembers: () => void;
    onSetCover: () => void;
  }

  let { space, gradientClass = '', onAddPhotos, onInviteMembers, onSetCover }: Props = $props();

  let collapsed = $state(false);

  const hasPhotos = $derived((space.assetCount ?? 0) > 0);
  const hasMembers = $derived((space.memberCount ?? 0) > 1);
  const hasCover = $derived(space.thumbnailAssetId !== null && space.thumbnailAssetId !== undefined);

  const completedCount = $derived((hasPhotos ? 1 : 0) + (hasMembers ? 1 : 0) + (hasCover ? 1 : 0));
  const allComplete = $derived(completedCount === 3);
  const progressPercent = $derived(Math.round((completedCount / 3) * 100));

  const steps = $derived([
    {
      id: 'add-photos',
      icon: mdiImagePlusOutline,
      label: $t('spaces_onboarding_add_photos'),
      description: $t('spaces_onboarding_add_photos_description'),
      complete: hasPhotos,
      action: onAddPhotos,
    },
    {
      id: 'invite-members',
      icon: mdiAccountPlusOutline,
      label: $t('spaces_onboarding_invite_members'),
      description: $t('spaces_onboarding_invite_members_description'),
      complete: hasMembers,
      action: onInviteMembers,
    },
    {
      id: 'set-cover',
      icon: mdiImageFilterHdrOutline,
      label: $t('spaces_onboarding_set_cover'),
      description: $t('spaces_onboarding_set_cover_description'),
      complete: hasCover,
      action: onSetCover,
    },
  ]);
</script>

{#if !allComplete}
  <div
    class="mx-4 mt-4 mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-immich-dark-gray"
    data-testid="onboarding-banner"
    data-collapsed={collapsed}
  >
    <!-- Progress bar -->
    <div class="h-1 w-full bg-gray-100 dark:bg-gray-800">
      <div
        class="h-full bg-gradient-to-r transition-all duration-500 ease-out {gradientClass}"
        style="width: {progressPercent}%"
        data-testid="progress-bar-fill"
      ></div>
    </div>

    <!-- Header (always visible) -->
    <div class="flex items-center justify-between px-4 py-2.5">
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300" data-testid="progress-text">
        {$t('spaces_setup_steps_done', { values: { completed: completedCount, total: 3 } })}
      </p>
      <button
        type="button"
        class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        onclick={() => (collapsed = !collapsed)}
        data-testid="banner-collapse-toggle"
        aria-label={collapsed ? 'Expand' : 'Collapse'}
      >
        <Icon icon={collapsed ? mdiChevronDown : mdiChevronUp} size="20" />
      </button>
    </div>

    <!-- Steps (collapsible) -->
    {#if !collapsed}
      <div class="border-t border-gray-100 dark:border-gray-800">
        {#each steps as step, i (step.id)}
          {#if step.complete}
            <div
              class="flex items-center gap-3 px-4 py-3 opacity-50 {i < steps.length - 1
                ? 'border-b border-gray-100 dark:border-gray-800'
                : ''}"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br {gradientClass}"
              >
                <span data-testid="step-{step.id}-check">
                  <Icon icon={mdiCheck} size="20" class="text-white" />
                </span>
              </div>
              <span class="flex-1 text-sm font-medium text-gray-400 line-through dark:text-gray-500">
                {step.label}
              </span>
            </div>
          {:else}
            <button
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800/50 {i <
              steps.length - 1
                ? 'border-b border-gray-100 dark:border-gray-800'
                : ''}"
              onclick={step.action}
              data-testid="step-{step.id}-action"
            >
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon icon={step.icon} size="20" class="text-primary" />
              </div>
              <span class="flex-1 text-left text-sm font-medium dark:text-white">{step.label}</span>
              <Icon icon={mdiChevronRight} size="20" class="text-gray-400" />
            </button>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}
