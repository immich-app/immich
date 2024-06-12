interface Options {
  onFocusOut?: (event: FocusEvent) => void;
}

export function focusOutside(node: HTMLElement, options: Options = {}) {
  const { onFocusOut } = options;

  const handleFocusOut = (event: FocusEvent) => {
    if (onFocusOut && event.relatedTarget instanceof Node && !node.contains(event.relatedTarget as Node)) {
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
