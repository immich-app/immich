<script lang="ts" module>
  export type AccordionState = Set<string>;

  const { get: getAccordionState, set: setAccordionState } = createContext<Writable<AccordionState>>();
  export { getAccordionState };
</script>

<script lang="ts">
  import { writable, type Writable } from 'svelte/store';
  import { createContext } from '$lib/utils/context';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { Snippet } from 'svelte';
  import { handlePromiseError,addSearchParams } from '$lib/utils';
  import { type ServerAboutResponseDto, type ServerVersionHistoryResponseDto } from '@immich/sdk';

  const getParamValues = (param: string) => {
    return new Set((page.url.searchParams.get(param) || '').split(' ').filter((x) => x !== ''));
  };

  interface Props {
    queryParam: string;
    state?: Writable<AccordionState>;
    children?: Snippet;
  }

  let { queryParam, state = writable(getParamValues(queryParam)), children }: Props = $props();
  setAccordionState(state);

  const searchParams = new URLSearchParams(page.url.searchParams);

  $effect(() => {
    if ($state.size > 0) {
      searchParams.set(queryParam, [...$state].join(' '));
    } else {
      searchParams.delete(queryParam);
    }

    handlePromiseError(addSearchParams(searchParams.toString()));
  });
</script>

{@render children?.()}
