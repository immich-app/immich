<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    displayedData: any;
    isSelected: boolean;
    isSelectedEqualOriginal: boolean;
    selectedData: any;
    slotHeight?: number;
    onClick: () => void;
    children?: Snippet;
  }

  let { displayedData, isSelected, isSelectedEqualOriginal, selectedData, slotHeight, onClick, children }: Props =
    $props();

  let button = $state<HTMLButtonElement>();
  export function getHeight(): number {
    if (button) {
      return button.getBoundingClientRect().height;
    }
    return 0;
  }

  const getClasses = () => {
    let classes = 'rounded-xl';
    if (displayedData) {
      classes += ' dark:hover:bg-gray-300';
      classes += isSelected ? ' hover:bg-gray-300' : ' dark:hover:bg-gray-300 hover:bg-gray-500';
    }
    if (isSelected && selectedData !== null && !isSelectedEqualOriginal) {
      classes += ' bg-red-300/90';
    }

    return classes;
  };
</script>

<button
  bind:this={button}
  disabled={!displayedData}
  type="button"
  style="padding: 3px; {slotHeight ? 'height: ' + slotHeight + 'px' : ''}"
  class={getClasses()}
  onclick={onClick}
>
  {@render children?.()}
</button>
