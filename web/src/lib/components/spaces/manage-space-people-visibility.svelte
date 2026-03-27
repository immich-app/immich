<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { ToggleVisibility } from '$lib/constants';
  import { createUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateSpacePerson, type SharedSpacePersonResponseDto } from '@immich/sdk';
  import { Button, IconButton, toastManager } from '@immich/ui';
  import { mdiClose, mdiEye, mdiEyeOff, mdiEyeSettings, mdiRestart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  interface Props {
    people: SharedSpacePersonResponseDto[];
    spaceId: string;
    onClose: () => void;
    onUpdate: (people: SharedSpacePersonResponseDto[]) => void;
  }

  let { people, spaceId, onClose, onUpdate }: Props = $props();

  let toggleVisibility = $state(ToggleVisibility.SHOW_ALL);
  let showLoadingSpinner = $state(false);
  const overrides = new SvelteMap<string, boolean>();

  const getNextVisibility = (current: ToggleVisibility) => {
    if (current === ToggleVisibility.SHOW_ALL) {
      return ToggleVisibility.HIDE_UNNANEMD;
    } else if (current === ToggleVisibility.HIDE_UNNANEMD) {
      return ToggleVisibility.HIDE_ALL;
    }
    return ToggleVisibility.SHOW_ALL;
  };

  const handleToggleVisibility = () => {
    toggleVisibility = getNextVisibility(toggleVisibility);
    for (const person of people) {
      let isHidden = overrides.get(person.id) ?? person.isHidden;
      if (toggleVisibility === ToggleVisibility.HIDE_ALL) {
        isHidden = true;
      } else if (toggleVisibility === ToggleVisibility.SHOW_ALL) {
        isHidden = false;
      } else if (toggleVisibility === ToggleVisibility.HIDE_UNNANEMD && !person.name) {
        isHidden = true;
      }
      setHiddenOverride(person, isHidden);
    }
  };

  const handleSave = async () => {
    showLoadingSpinner = true;
    const changed = Array.from(overrides, ([id, isHidden]) => ({ id, isHidden }));

    try {
      if (changed.length > 0) {
        const results = await Promise.allSettled(
          changed.map(({ id, isHidden }) =>
            updateSpacePerson({ id: spaceId, personId: id, sharedSpacePersonUpdateDto: { isHidden } }),
          ),
        );
        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const failCount = results.length - successCount;
        if (failCount > 0) {
          toastManager.warning($t('errors.unable_to_change_visibility', { values: { count: failCount } }));
        }
        toastManager.primary($t('visibility_changed', { values: { count: successCount } }));
      }

      for (const person of people) {
        const isHidden = overrides.get(person.id);
        if (isHidden !== undefined) {
          person.isHidden = isHidden;
        }
      }
      overrides.clear();
      onUpdate(people);
      onClose();
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_visibility', { values: { count: changed.length } }));
    } finally {
      showLoadingSpinner = false;
    }
  };

  const setHiddenOverride = (person: SharedSpacePersonResponseDto, isHidden: boolean) => {
    if (isHidden === person.isHidden) {
      overrides.delete(person.id);
      return;
    }
    overrides.set(person.id, isHidden);
  };

  const getThumbUrl = (person: SharedSpacePersonResponseDto): string => {
    return createUrl(`/shared-spaces/${spaceId}/people/${person.id}/thumbnail`, { updatedAt: person.updatedAt });
  };

  let toggleButtonOptions: Record<ToggleVisibility, { icon: string; label: string }> = $derived({
    [ToggleVisibility.HIDE_ALL]: { icon: mdiEyeOff, label: $t('hide_all_people') },
    [ToggleVisibility.HIDE_UNNANEMD]: { icon: mdiEyeSettings, label: $t('hide_unnamed_people') },
    [ToggleVisibility.SHOW_ALL]: { icon: mdiEye, label: $t('show_all_people') },
  });
  let toggleButton = $derived(toggleButtonOptions[getNextVisibility(toggleVisibility)]);

  const sortedPeople = $derived(
    [...people].sort((a, b) => {
      const aHasName = a.name ? 0 : 1;
      const bHasName = b.name ? 0 : 1;
      if (aHasName !== bHasName) {
        return aHasName - bHasName;
      }
      return b.assetCount - a.assetCount;
    }),
  );
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onClose }} />

<div class="h-full overflow-y-auto">
  <div
    class="sticky top-0 z-1 flex h-16 w-full items-center justify-between border-b bg-white p-1 dark:border-immich-dark-gray dark:bg-black dark:text-immich-dark-fg md:p-8"
  >
    <div class="flex items-center">
      <span title={$t('close')}>
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          aria-label={$t('close')}
          icon={mdiClose}
          onclick={onClose}
          data-testid="close-visibility"
        />
      </span>
      <p class="ms-2">{$t('show_and_hide_people')}</p>
    </div>
    <div class="flex items-center justify-end">
      <div class="flex items-center md:me-4">
        <span title={$t('reset_people_visibility')}>
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            aria-label={$t('reset_people_visibility')}
            icon={mdiRestart}
            onclick={() => overrides.clear()}
          />
        </span>
        <span title={toggleButton.label}>
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            aria-label={toggleButton.label}
            icon={toggleButton.icon}
            onclick={handleToggleVisibility}
          />
        </span>
      </div>
      <Button loading={showLoadingSpinner} onclick={handleSave} size="small" data-testid="save-visibility"
        >{$t('done')}</Button
      >
    </div>
  </div>

  <div class="flex flex-wrap gap-1 p-2 pb-8 md:px-8">
    {#each sortedPeople as person (person.id)}
      {@const hidden = overrides.get(person.id) ?? person.isHidden}
      <button
        type="button"
        class="group relative"
        style="width: 6rem; height: 6rem;"
        onclick={() => setHiddenOverride(person, !hidden)}
        aria-pressed={hidden}
        data-testid="visibility-person-{person.id}"
      >
        <ImageThumbnail
          {hidden}
          shadow
          url={getThumbUrl(person)}
          altText={person.name || ''}
          widthStyle="100%"
          hiddenIconClass="text-white group-hover:text-black transition-colors"
          preload={false}
        />
        {#if person.name}
          <span class="absolute bottom-2 start-0 w-full select-text px-1 text-center text-xs font-medium text-white">
            {person.name}
          </span>
        {/if}
      </button>
    {/each}
  </div>
</div>
