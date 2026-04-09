<script lang="ts">
  export let zones: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    action: string;
  }> = [];
  export let isLoading: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    create: { name: string; latitude: number; longitude: number; radiusMeters: number; action: string };
    delete: string;
    edit: { id: string; name: string; radiusMeters: number; action: string };
  }>();

  let showCreateForm = false;
  let newZone = {
    name: '',
    latitude: 0,
    longitude: 0,
    radiusMeters: 500,
    action: 'strip_gps',
  };

  const actionLabels: Record<string, string> = {
    strip_gps: '🚫 Strip GPS',
    blur_location: '🔵 Blur Location',
    offset_random: '🎲 Random Offset',
    block_share: '🔒 Block Sharing',
  };

  const actionDescriptions: Record<string, string> = {
    strip_gps: 'Remove all GPS coordinates when sharing',
    blur_location: 'Round coordinates to ~1km precision',
    offset_random: 'Randomly offset location by up to 500m',
    block_share: 'Prevent sharing assets in this zone',
  };

  function handleCreate() {
    if (newZone.name && newZone.latitude && newZone.longitude) {
      dispatch('create', { ...newZone });
      newZone = { name: '', latitude: 0, longitude: 0, radiusMeters: 500, action: 'strip_gps' };
      showCreateForm = false;
    }
  }

  function handleDelete(id: string) {
    dispatch('delete', id);
  }

  function formatRadius(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  }
</script>

<div class="privacy-zones">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
        🛡️ Privacy Zones
      </h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        Protect location data when sharing photos from sensitive areas
      </p>
    </div>
    <button
      on:click={() => (showCreateForm = !showCreateForm)}
      class="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
    >
      {showCreateForm ? 'Cancel' : '+ Add Zone'}
    </button>
  </div>

  {#if showCreateForm}
    <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Zone Name</label>
          <input
            bind:value={newZone.name}
            type="text"
            placeholder="e.g., Home, Office, School"
            class="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Latitude</label>
          <input
            bind:value={newZone.latitude}
            type="number"
            step="0.000001"
            class="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Longitude</label>
          <input
            bind:value={newZone.longitude}
            type="number"
            step="0.000001"
            class="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Radius</label>
          <input
            bind:value={newZone.radiusMeters}
            type="number"
            min="50"
            max="50000"
            step="50"
            class="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Action</label>
          <select
            bind:value={newZone.action}
            class="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            {#each Object.entries(actionLabels) as [value, label]}
              <option {value}>{label}</option>
            {/each}
          </select>
        </div>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">{actionDescriptions[newZone.action]}</p>
      <button
        on:click={handleCreate}
        disabled={!newZone.name || !newZone.latitude || !newZone.longitude}
        class="mt-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        Create Privacy Zone
      </button>
    </div>
  {/if}

  {#if zones.length > 0}
    <div class="space-y-2">
      {#each zones as zone}
        <div class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-800 dark:text-gray-200">📍 {zone.name}</span>
              <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {formatRadius(zone.radiusMeters)}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {actionLabels[zone.action] || zone.action}
            </p>
          </div>
          <button
            on:click={() => handleDelete(zone.id)}
            class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
            title="Delete zone"
          >
            🗑
          </button>
        </div>
      {/each}
    </div>
  {:else if !showCreateForm}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>No privacy zones configured</p>
      <p class="text-xs mt-1">Add zones around sensitive locations like your home</p>
    </div>
  {/if}
</div>
