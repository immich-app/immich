<script context="module" lang="ts">
  import { tick } from 'svelte';

  /**
   * Usage: <div use:portal={'css selector'}> or <div use:portal={document.body}>
   */
  export function portal(element: HTMLElement, target: HTMLElement | string = 'body') {
    let targetElement;
    async function update(newTarget: HTMLElement | string) {
      target = newTarget;
      if (typeof target === 'string') {
        targetElement = document.querySelector(target);
        if (targetElement === null) {
          await tick();
          targetElement = document.querySelector(target);
        }
        if (targetElement === null) {
          throw new Error(`No element found matching css selector: "${target}"`);
        }
      } else if (target instanceof HTMLElement) {
        targetElement = target;
      } else {
        throw new TypeError(
          `Unknown portal target type: ${
            target === null ? 'null' : typeof target
          }. Allowed types: string (CSS selector) or HTMLElement.`,
        );
      }
      targetElement.append(element);
      element.hidden = false;
    }

    function destroy() {
      if (element.parentNode) {
        element.remove();
      }
    }

    update(target);
    return {
      update,
      destroy,
    };
  }
</script>

<script lang="ts">
  /**
   * DOM Element or CSS Selector
   */
  export let target: HTMLElement | string = 'body';
</script>

<div use:portal={target} hidden>
  <slot />
</div>
