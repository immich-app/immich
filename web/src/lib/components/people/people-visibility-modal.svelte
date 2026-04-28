<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import type { VisibilityChange, VisibilityPerson, VisibilitySaveResult } from '$lib/components/people/people-types';
  import PeopleGrid from '$lib/components/people/people-grid.svelte';
  import { ToggleVisibility } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, IconButton, toastManager } from '@immich/ui';
  import { mdiClose, mdiEye, mdiEyeOff, mdiEyeSettings, mdiRestart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  interface Props {
    people: VisibilityPerson[];
    titleId?: string | undefined;
    totalPeopleCount?: number | undefined;
    gridClass?: string;
    personButtonClass?: string;
    personStyle?: string;
    hasMore?: boolean;
    loading?: boolean;
    onClose: () => void;
    onUpdate: (people: VisibilityPerson[]) => void;
    loadNextPage?: () => void;
    saveVisibilityChanges: (changes: VisibilityChange[]) => Promise<VisibilitySaveResult>;
  }

  let {
    people,
    titleId = undefined,
    totalPeopleCount = undefined,
    gridClass = 'w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-10 gap-1',
    personButtonClass = 'group relative w-full h-full',
    personStyle = undefined,
    hasMore = false,
    loading = false,
    onClose,
    onUpdate,
    loadNextPage = () => {},
    saveVisibilityChanges,
  }: Props = $props();

  let toggleVisibility = $state(ToggleVisibility.SHOW_ALL);
  let showLoadingSpinner = $state(false);
  const overrides = new SvelteMap<string, boolean>();

  const getNextVisibility = (current: ToggleVisibility) =>
    current === ToggleVisibility.SHOW_ALL
      ? ToggleVisibility.HIDE_UNNANEMD
      : current === ToggleVisibility.HIDE_UNNANEMD
        ? ToggleVisibility.HIDE_ALL
        : ToggleVisibility.SHOW_ALL;

  const setHiddenOverride = (person: VisibilityPerson, isHidden: boolean) => {
    if (isHidden === person.isHidden) {
      overrides.delete(person.id);
      return;
    }
    overrides.set(person.id, isHidden);
  };

  const handleToggleVisibility = () => {
    toggleVisibility = getNextVisibility(toggleVisibility);

    for (const person of people) {
      let isHidden = overrides.get(person.id) ?? person.isHidden;
      if (toggleVisibility === ToggleVisibility.HIDE_ALL) {
        isHidden = true;
      } else if (toggleVisibility === ToggleVisibility.SHOW_ALL) {
        isHidden = false;
      } else if (toggleVisibility === ToggleVisibility.HIDE_UNNANEMD && !person.displayName) {
        isHidden = true;
      }
      setHiddenOverride(person, isHidden);
    }
  };

  const handleSaveVisibility = async () => {
    showLoadingSpinner = true;
    const changed = Array.from(overrides, ([id, isHidden]) => ({ id, isHidden }));

    try {
      if (changed.length > 0) {
        const { successCount, failCount } = await saveVisibilityChanges(changed);
        if (failCount > 0) {
          toastManager.warning($t('errors.unable_to_change_visibility', { values: { count: failCount } }));
        }
        toastManager.primary($t('visibility_changed', { values: { count: successCount } }));
      }

      const updatedPeople = people.map((person) => {
        const isHidden = overrides.get(person.id);
        return isHidden === undefined ? person : { ...person, isHidden };
      });
      overrides.clear();
      onUpdate(updatedPeople);
      onClose();
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_visibility', { values: { count: changed.length } }));
    } finally {
      showLoadingSpinner = false;
    }
  };

  let toggleButtonOptions: Record<ToggleVisibility, { icon: string; label: string }> = $derived({
    [ToggleVisibility.HIDE_ALL]: { icon: mdiEyeOff, label: $t('hide_all_people') },
    [ToggleVisibility.HIDE_UNNANEMD]: { icon: mdiEyeSettings, label: $t('hide_unnamed_people') },
    [ToggleVisibility.SHOW_ALL]: { icon: mdiEye, label: $t('show_all_people') },
  });
  let toggleButton = $derived(toggleButtonOptions[getNextVisibility(toggleVisibility)]);
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
      <div class="flex gap-2 items-center">
        <p id={titleId} class="ms-2">{$t('show_and_hide_people')}</p>
        {#if totalPeopleCount !== undefined}
          <p class="text-sm text-gray-400 dark:text-gray-600">({totalPeopleCount.toLocaleString($locale)})</p>
        {/if}
      </div>
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
      <Button loading={showLoadingSpinner} onclick={handleSaveVisibility} size="small" data-testid="save-visibility">
        {$t('done')}
      </Button>
    </div>
  </div>

  <div class="flex flex-wrap gap-1 p-2 pb-8 md:px-8">
    <PeopleGrid items={people} class={gridClass} hasNextPage={hasMore} {loading} {loadNextPage}>
      {#snippet children(person)}
        {@const hidden = overrides.get(person.id) ?? person.isHidden}
        <button
          type="button"
          class={personButtonClass}
          style={personStyle}
          onclick={() => setHiddenOverride(person, !hidden)}
          aria-pressed={hidden}
          aria-label={person.displayName
            ? $t('hide_named_person', { values: { name: person.displayName } })
            : $t('hide_person')}
          data-testid="visibility-person-{person.id}"
        >
          <ImageThumbnail
            {hidden}
            shadow
            url={person.thumbnailUrl}
            altText={person.displayName}
            widthStyle="100%"
            hiddenIconClass="text-white group-hover:text-black transition-colors"
            preload={false}
          />
          {#if person.displayName}
            <span class="absolute bottom-2 start-0 w-full select-text px-1 text-center font-medium text-white">
              {person.displayName}
            </span>
          {/if}
        </button>
      {/snippet}
    </PeopleGrid>
  </div>
</div>
