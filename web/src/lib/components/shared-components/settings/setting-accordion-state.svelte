<script lang="ts" module>
  export type AccordionState = Set<string>;

  const { get: getAccordionState, set: setAccordionState } = createContext<Writable<AccordionState>>();
  export { getAccordionState };
</script>

<script lang="ts">
  import { run } from 'svelte/legacy';

  import { writable, type Writable } from 'svelte/store';
  import { createContext } from '$lib/utils/context';
  import { page } from '$app/stores';
  import { handlePromiseError } from '$lib/utils';
  import { goto } from '$app/navigation';

  const getParamValues = (param: string) => {
    return new Set(($page.url.searchParams.get(param) || '').split(' ').filter((x) => x !== ''));
  };

  interface Props {
    queryParam: string;
    state?: Writable<AccordionState>;
    children?: import('svelte').Snippet;
  }

  let { queryParam, state = writable(getParamValues(queryParam)), children }: Props = $props();
  setAccordionState(state);

  run(() => {
    if (queryParam && $state) {
      const searchParams = new URLSearchParams($page.url.searchParams);
      if ($state.size > 0) {
        searchParams.set(queryParam, [...$state].join(' '));
      } else {
        searchParams.delete(queryParam);
      }

      handlePromiseError(goto(`?${searchParams.toString()}`, { replaceState: true, noScroll: true, keepFocus: true }));
    }
  });
</script>

{@render children?.()}
