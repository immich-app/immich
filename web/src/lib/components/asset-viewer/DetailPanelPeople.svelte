<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type AssetResponseDto } from '@immich/sdk';
  import { IconButton, Text } from '@immich/ui';
  import { mdiEye, mdiEyeOff, mdiPencil, mdiPlus } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    asset: AssetResponseDto;
    isOwner: boolean;
    previousRoute: string;
  };

  const { asset, isOwner, previousRoute }: Props = $props();

  const unassignedFaces = $derived(asset.unassignedFaces || []);
  const people = $derived(asset.people || []);
  const visiblePeople = $derived(
    people
      .filter((p) => assetViewerManager.isShowingHiddenPeople || !p.isHidden)
      .map((person) => {
        if (!person.birthDate) {
          return { formattedBirthDate: undefined, formattedAge: undefined, ...person };
        }
        const personBirthDate = DateTime.fromISO(person.birthDate);
        const ageInYears = Math.floor(DateTime.fromISO(asset.localDateTime).diff(personBirthDate, 'years').years);
        const ageInMonths = Math.floor(DateTime.fromISO(asset.localDateTime).diff(personBirthDate, 'months').months);

        let formattedAge;
        if (ageInYears < 0) {
          return { formattedBirthDate: undefined, formattedAge: undefined, ...person };
        } else if (ageInMonths < 12) {
          formattedAge = $t('age_months', { values: { months: ageInMonths } });
        } else if (ageInMonths > 12 && ageInMonths < 24) {
          formattedAge = $t('age_year_months', { values: { months: ageInMonths - 12 } });
        } else {
          formattedAge = $t('age_years', { values: { years: ageInYears } });
        }

        const formattedBirthDate = personBirthDate.toLocaleString(
          {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          },
          { locale: $locale },
        );
        return { formattedBirthDate, formattedAge, ...person };
      }),
  );
</script>

{#if !authManager.isSharedLink && isOwner}
  <section class="px-4 pt-4 text-sm">
    <div class="flex h-10 w-full items-center justify-between">
      <Text size="small" color="muted">{$t('people')}</Text>
      <div class="flex items-center gap-2">
        {#if people.some((person) => person.isHidden)}
          <IconButton
            aria-label={$t('show_hidden_people')}
            icon={assetViewerManager.isShowingHiddenPeople ? mdiEyeOff : mdiEye}
            size="medium"
            shape="round"
            color="secondary"
            variant="ghost"
            onclick={() => assetViewerManager.toggleHiddenPeople()}
          />
        {/if}
        <IconButton
          aria-label={$t('tag_people')}
          icon={mdiPlus}
          size="medium"
          shape="round"
          color="secondary"
          variant="ghost"
          onclick={() => assetViewerManager.toggleFaceEditMode()}
        />

        {#if people.length > 0 || unassignedFaces.length > 0}
          <IconButton
            aria-label={$t('edit_people')}
            icon={mdiPencil}
            size="medium"
            shape="round"
            color="secondary"
            variant="ghost"
            onclick={() => assetViewerManager.openEditFacesPanel()}
          />
        {/if}
      </div>
    </div>

    <div class="mt-2 grid {visiblePeople.length <= 6 ? 'grid-cols-3 gap-3' : 'grid-cols-4 gap-2'}">
      {#each visiblePeople as person (person.id)}
        {@const isHighlighted = person.faces.some((f) =>
          assetViewerManager.highlightedFaces.some((b) => b.id === f.id),
        )}
        <a
          class="group outline-none"
          href={Route.viewPerson(person, { previousRoute })}
          onfocus={() => assetViewerManager.setHighlightedFaces(person.faces)}
          onblur={() => assetViewerManager.clearHighlightedFaces()}
          onpointerenter={() => assetViewerManager.setHighlightedFaces(person.faces)}
          onpointerleave={() => assetViewerManager.clearHighlightedFaces()}
        >
          <ImageThumbnail
            curve
            shadow
            url={getPeopleThumbnailUrl(person)}
            altText={person.name}
            title={person.name}
            widthStyle="100%"
            hidden={person.isHidden}
            highlighted={isHighlighted}
            class="outline-offset-2 outline-immich-primary group-focus-visible:outline-2 dark:outline-immich-dark-primary"
          />
          <p class="mt-1 truncate font-medium" title={person.name}>{person.name}</p>
          {#if person.birthDate && person.formattedAge}
            <p class="font-light {visiblePeople.length > 6 ? 'text-xs' : ''}" title={person.formattedBirthDate!}>
              {person.formattedAge}
            </p>
          {/if}
        </a>
      {/each}
    </div>
  </section>
{/if}
