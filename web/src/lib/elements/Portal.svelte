<script module lang="ts">
  import { handlePromiseError } from '$lib/utils';
  import { tick, type Snippet } from 'svelte';

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

    handlePromiseError(update(target));
    return {
      update,
      destroy,
    };
  }
</script>

<!--
@component
Allow rendering a component in a different part of the DOM.

### Props
- `target` - HTMLElement i.e "body", "html", default is "body"

### Default Slot
Used for every occurrence of an HTML tag in a message
- `tag` - Name of the tag

@example
```html
<Portal target="body">
  <p>Your component in here</p>
</Portal>
```
-->
<script lang="ts">
  interface Props {
    /**
     * DOM Element or CSS Selector
     */
    target?: HTMLElement | string;
    children?: Snippet;
  }

  let { target = 'body', children }: Props = $props();
</script>

<div use:portal={target} hidden>
  {@render children?.()}
</div>
