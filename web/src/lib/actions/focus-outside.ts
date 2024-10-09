interface Options {
  onFocusOut?: (event: FocusEvent) => void;
}

/**
 * Calls a function when focus leaves the element.
 * @param node
 * @param options Object containing onFocusOut function
 */
export function focusOutside(node: HTMLElement, options: Options = {}) {
  const { onFocusOut } = options;

  const handleFocusOut = (event: FocusEvent) => {
    if (
      onFocusOut &&
      (!event.relatedTarget || (event.relatedTarget instanceof Node && !node.contains(event.relatedTarget as Node)))
    ) {
      onFocusOut(event);
    }
  };

  node.addEventListener('focusout', handleFocusOut);

  return {
    destroy() {
      node.removeEventListener('focusout', handleFocusOut);
    },
  };
}
