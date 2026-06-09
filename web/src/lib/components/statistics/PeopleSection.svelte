<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import { Route } from '$lib/route';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { t } from 'svelte-i18n';
  import PeopleProgress from './PeopleProgress.svelte';

  interface PersonSummary {
    id: string;
    name: string;
    birthDate: string | null;
    thumbnailPath: string;
    isHidden: boolean;
    updatedAt?: string;
    isFavorite?: boolean;
    color?: string;
    count: number;
  }

  interface Props {
    topPeople: PersonSummary[];
    topPeopleTotal: number;
  }

  let { topPeople = [], topPeopleTotal = 0 }: Props = $props();
</script>

{#if topPeople.length > 0}
  <section
    class="rounded-3xl border border-gray-200/70 bg-light p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-bg"
  >
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">{$t('people')}</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-immich-dark-fg/75">{$t('people_feature_description')}</p>
      </div>
      <div class="text-sm text-gray-500 dark:text-immich-dark-fg/75">
        {topPeople.length}
        {$t('people')} · {topPeopleTotal.toLocaleString()} appearances
      </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {#each topPeople as person, index (person.id)}
          <a
            href={Route.viewPerson(person, { previousRoute: Route.statistics() })}
            class="group rounded-3xl border border-transparent bg-subtle p-4 transition-colors duration-200 hover:border-gray-200 hover:bg-gray-100 dark:bg-immich-dark-gray dark:hover:border-gray-800 dark:hover:bg-gray-900"
          >
            <div class="flex items-start gap-4">
              <div class="relative shrink-0">
                <ImageThumbnail
                  circle
                  shadow
                  url={getPeopleThumbnailUrl(person)}
                  altText={person.name}
                  title={person.name}
                  widthStyle="4.25rem"
                  preload={index === 0}
                />
                {#if person.isHidden}
                  <span
                    class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase"
                  >
                    Hidden
                  </span>
                {/if}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-base font-semibold text-immich-fg dark:text-immich-dark-fg">
                      {person.name || $t('unknown')}
                    </p>
                    <p class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75">
                      #{index + 1}
                    </p>
                  </div>
                  <p class="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg">
                    {person.count.toLocaleString()}
                  </p>
                </div>

                <PeopleProgress
                  widthPercent={topPeopleTotal > 0 ? Math.min(100, (person.count / topPeopleTotal) * 100) : 0}
                />

                <p class="mt-2 text-xs text-gray-500 dark:text-immich-dark-fg/75">
                  {$t('appears_in')}
                  {Math.round((person.count / topPeopleTotal) * 100)}%
                </p>
              </div>
            </div>
          </a>
        {/each}
      </div>

      <div class="overflow-hidden rounded-3xl border border-gray-200/70 dark:border-immich-dark-gray">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-subtle/40">
          <thead class="bg-subtle dark:bg-immich-dark-gray">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75"
              >
                Rank
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75"
              >
                {$t('person')}
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75"
              >
                Count
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white dark:divide-subtle/40 dark:bg-immich-dark-bg">
            {#each topPeople as person, index (person.id)}
              <tr class={index === 0 ? 'bg-cyan-50/60 dark:bg-cyan-900/15' : 'dark:hover:bg-immich-dark-gray/60'}>
                <td class="px-4 py-3 text-sm font-semibold text-immich-fg dark:text-immich-dark-fg">#{index + 1}</td>
                <td class="px-4 py-3 text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
                  <a
                    class="block transition-colors hover:text-primary"
                    href={Route.viewPerson(person, { previousRoute: Route.statistics() })}
                  >
                    {person.name || $t('unknown')}
                  </a>
                </td>
                <td class="px-4 py-3 text-right text-sm font-semibold text-immich-fg dark:text-immich-dark-fg">
                  {person.count.toLocaleString()}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>
{/if}
