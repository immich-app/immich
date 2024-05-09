interface Options {
  onFocusOut?: () => void;
}

export function focusOutside(node: HTMLElement, options: Options = {}) {
  const { onFocusOut } = options;

  const handleFocusOut = (event: FocusEvent) => {
    if (onFocusOut && event.relatedTarget instanceof Node && !node.contains(event.relatedTarget as Node)) {
      onFocusOut();
    }
  };

  node.addEventListener('focusout', handleFocusOut);

  return {
    destroy() {
      node.removeEventListener('focusout', handleFocusOut);
    },
  };
}
