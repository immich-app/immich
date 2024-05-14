<script lang="ts">
  import { shortcuts } from '$lib/utils/shortcut';
  import { onMount, onDestroy } from 'svelte';

  let container: HTMLElement;
  let triggerElement: HTMLElement;

  onMount(() => {
    triggerElement = document.activeElement as HTMLElement;
    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();
  });

  onDestroy(() => {
    triggerElement?.focus();
  });

  const getFocusableElements = () => {
    return Array.from(
      container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ) as HTMLElement[];
  };

  const trapFocus = (direction: 'forward' | 'backward', event: KeyboardEvent) => {
    const focusableElements = getFocusableElements();
    const elementCount = focusableElements.length;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(elementCount - 1);

    if (document.activeElement === lastElement && direction === 'forward') {
      event.preventDefault();
      firstElement?.focus();
    } else if (document.activeElement === firstElement && direction === 'backward') {
      event.preventDefault();
      lastElement?.focus();
    }
  };
</script>

<div
  bind:this={container}
  use:shortcuts={[
    {
      ignoreInputFields: false,
      shortcut: { key: 'Tab' },
      onShortcut: (event) => {
        trapFocus('forward', event);
      },
      preventDefault: false,
    },
    {
      ignoreInputFields: false,
      shortcut: { key: 'Tab', shift: true },
      onShortcut: (event) => {
        trapFocus('backward', event);
      },
      preventDefault: false,
    },
  ]}
>
  <slot />
</div>
