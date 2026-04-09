<script lang="ts">
  export let query: string = '';
  export let suggestions: string[] = [];
  export let isSearching: boolean = false;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ search: string; clear: void }>();

  let showSuggestions = false;

  const exampleQueries = [
    'Beach vacation 2023',
    'Birthday party with kids',
    'Sunset at the lake',
    'Christmas morning',
    'Photos of dogs in the park',
    'Wedding ceremony',
    'Hiking in the mountains',
  ];

  function handleSearch() {
    if (query.trim()) {
      showSuggestions = false;
      dispatch('search', query.trim());
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    } else if (event.key === 'Escape') {
      showSuggestions = false;
    }
  }

  function selectSuggestion(suggestion: string) {
    query = suggestion;
    showSuggestions = false;
    handleSearch();
  }

  function handleClear() {
    query = '';
    dispatch('clear');
  }

  function handleFocus() {
    if (!query && exampleQueries.length) {
      showSuggestions = true;
    }
  }
</script>

<div class="nlp-search relative">
  <div class="relative">
    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      {#if isSearching}
        <span class="animate-spin text-lg">🔍</span>
      {:else}
        <span class="text-gray-400">🔍</span>
      {/if}
    </div>
    <input
      type="text"
      bind:value={query}
      on:keydown={handleKeydown}
      on:focus={handleFocus}
      on:blur={() => setTimeout(() => (showSuggestions = false), 200)}
      placeholder="Search naturally... 'beach photos from last summer' or 'kids at the park'"
      class="w-full pl-10 pr-20 py-3 text-sm border border-gray-300 rounded-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
    />
    <div class="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
      {#if query}
        <button
          on:click={handleClear}
          class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full"
          title="Clear"
        >
          ✕
        </button>
      {/if}
      <button
        on:click={handleSearch}
        disabled={!query.trim() || isSearching}
        class="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        Search
      </button>
    </div>
  </div>

  {#if showSuggestions}
    <div class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <div class="p-2">
        <p class="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1 font-medium">Try searching for...</p>
        {#each exampleQueries as suggestion}
          <button
            on:click={() => selectSuggestion(suggestion)}
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {suggestion}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  {#if suggestions.length > 0}
    <div class="flex flex-wrap gap-1 mt-2">
      {#each suggestions as suggestion}
        <button
          on:click={() => selectSuggestion(suggestion)}
          class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {suggestion}
        </button>
      {/each}
    </div>
  {/if}
</div>
