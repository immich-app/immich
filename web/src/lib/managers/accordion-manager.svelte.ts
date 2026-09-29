import { SvelteSet, SvelteURLSearchParams } from 'svelte/reactivity';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { QueryParameter } from '$lib/constants';
import { handlePromiseError } from '$lib/utils';

class AccordionManager {
  // needs to be derived since `page.url.searchParams` isn't actually initialized by the time this class gets instantiated.
  #searchParams = $derived(new SvelteURLSearchParams(page.url.searchParams));
  #state = $derived(
    new SvelteSet(
      this.#searchParams
        .get(QueryParameter.IS_OPEN)
        ?.split(' ')
        .filter((x) => x !== ''),
    ),
  );

  isOpen(key: string) {
    return this.#state.has(key);
  }

  #refreshSearchParams() {
    if (this.#state.size === 0) {
      this.#searchParams.delete(QueryParameter.IS_OPEN);
    } else {
      this.#searchParams.set(QueryParameter.IS_OPEN, [...this.#state].join(' '));
    }

    handlePromiseError(
      goto(`?${this.#searchParams.toString()}`, { replaceState: true, noScroll: true, keepFocus: true }),
    );
  }

  open(key: string) {
    this.#state.add(key);
    this.#refreshSearchParams();
  }

  close(key: string) {
    this.#state.delete(key);
    this.#refreshSearchParams();
  }
}

export const accordionManager = new AccordionManager();
