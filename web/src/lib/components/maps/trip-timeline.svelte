<script lang="ts">
  export let trips: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    assetCount: number;
    locations: Array<{
      latitude: number;
      longitude: number;
      city?: string;
      country?: string;
    }>;
  }> = [];

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ select: string }>();

  function formatDateRange(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();

    if (sameMonth) {
      return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.getDate()}, ${e.getFullYear()}`;
    }
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  function getUniqueCountries(locations: Array<{ country?: string }>): string[] {
    const countries = new Set(locations.filter((l) => l.country).map((l) => l.country!));
    return [...countries];
  }

  function handleSelect(tripId: string) {
    dispatch('select', tripId);
  }
</script>

<div class="trip-timeline space-y-4">
  <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
    ✈️ Your Trips
  </h3>

  {#if trips.length > 0}
    <div class="relative">
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {#each trips as trip}
        <button
          on:click={() => handleSelect(trip.id)}
          class="relative flex gap-4 pl-10 pb-6 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-2 transition-colors"
        >
          <div class="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-gray-900" />

          <div class="flex-1">
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">{trip.name}</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {formatDateRange(trip.startDate, trip.endDate)}
            </p>
            <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span>📸 {trip.assetCount} photos</span>
              {#each getUniqueCountries(trip.locations).slice(0, 3) as country}
                <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{country}</span>
              {/each}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No trips detected yet</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Trips are auto-detected from your geotagged photos</p>
    </div>
  {/if}
</div>
