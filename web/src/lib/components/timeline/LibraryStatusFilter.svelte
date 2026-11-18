<script lang="ts">
  import { LibraryStatusFilter, libraryStatusFilter } from '#lib/stores/preferences.store.ts';
  import { Button } from '@immich/ui';
  import { mdiCheckCircleOutline, mdiClockOutline, mdiImageMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const filters = $derived([
    { value: LibraryStatusFilter.All, label: $t('all'), icon: mdiImageMultipleOutline },
    { value: LibraryStatusFilter.External, label: $t('in_external_library'), icon: mdiCheckCircleOutline },
    { value: LibraryStatusFilter.Pending, label: $t('pending_external_library'), icon: mdiClockOutline },
  ]);
</script>

<div class="flex items-center gap-1" role="radiogroup" aria-label={$t('external_library_filter')}>
  {#each filters as filter (filter.value)}
    {const active = $derived($libraryStatusFilter === filter.value)}
    <Button
      size="small"
      shape="round"
      variant={active ? 'filled' : 'ghost'}
      color={active ? 'primary' : 'secondary'}
      leadingIcon={filter.icon}
      role="radio"
      aria-checked={active}
      title={filter.label}
      onclick={() => libraryStatusFilter.set(filter.value)}
    >
      <span class="hidden md:inline">{filter.label}</span>
    </Button>
  {/each}
</div>
