import { SessionStorageKey } from '#lib/constants.ts';
import { handlePromiseError } from '#lib/utils.ts';
import { untrack } from 'svelte';
import { navigating } from '$app/state';

interface Options {
  /** This must be kept the same in all subpages of this route for the scroll memory clearer to work. */
  routeStartsWith: string;
  /** Function to clear additional data/state before scrolling (ex infinite scroll). */
  beforeClear?: () => void;
}

interface PageOptions extends Options {
  /** Function to save additional data/state before scrolling (ex infinite scroll). */
  beforeSave?: () => void;
  /** Function to load additional data/state before scrolling (ex infinite scroll). */
  beforeScroll?: () => Promise<void>;
}

export function scrollMemory({ routeStartsWith, beforeSave, beforeClear, beforeScroll }: PageOptions) {
  return (node: HTMLElement) => {
    $effect(() => {
      const existingScroll = sessionStorage.getItem(SessionStorageKey.SCROLL_POSITION);
      if (navigating?.to && !existingScroll) {
        // Save current scroll information when going into a subpage.
        if (navigating.to.url.pathname.startsWith(routeStartsWith)) {
          beforeSave?.();
          sessionStorage.setItem(SessionStorageKey.SCROLL_POSITION, node.scrollTop.toString());
        } else {
          beforeClear?.();
          sessionStorage.removeItem(SessionStorageKey.SCROLL_POSITION);
        }
      }
    });

    untrack(() =>
      handlePromiseError(
        (async () => {
          await beforeScroll?.();

          const newScroll = sessionStorage.getItem(SessionStorageKey.SCROLL_POSITION);
          if (newScroll) {
            node.scroll({
              top: Number(newScroll),
              behavior: 'instant',
            });
          }
          beforeClear?.();
          sessionStorage.removeItem(SessionStorageKey.SCROLL_POSITION);
        })(),
      ),
    );
  };
}

export function scrollMemoryClearer({ routeStartsWith, beforeClear }: Options) {
  return () => {
    // Forget scroll position from main page if going somewhere else.
    if (!navigating?.to || navigating?.to.url.pathname.startsWith(routeStartsWith)) {
      return;
    }

    beforeClear?.();
    sessionStorage.removeItem(SessionStorageKey.SCROLL_POSITION);
  };
}
