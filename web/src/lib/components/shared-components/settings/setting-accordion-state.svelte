<script lang="ts" context="module">
  export type AccordionState = Set<string>;

  const { get: getAccordionState, set: setAccordionState } = createContext<Writable<AccordionState>>();
  export { getAccordionState };
</script>

<script lang="ts">
  import { writable, type Writable } from 'svelte/store';
  import { createContext } from '$lib/utils/context';
  import { page } from '$app/stores';
  import { handlePromiseError } from '$lib/utils';
  import { goto } from '$app/navigation';

  const getParamValues = (param: string) => {
    return new Set(($page.url.searchParams.get(param) || '').split(' ').filter((x) => x !== ''));
  };

  export let queryParam: string;
  export let state: Writable<AccordionState> = writable(getParamValues(queryParam));
  setAccordionState(state);

  $: if (queryParam && $state) {
    const searchParams = new URLSearchParams($page.url.searchParams);
    if ($state.size > 0) {
      searchParams.set(queryParam, [...$state].join(' '));
    } else {
      searchParams.delete(queryParam);
    }

    handlePromiseError(goto(`?${searchParams.toString()}`, { replaceState: true, noScroll: true, keepFocus: true }));
  }
</script>

<slot />
