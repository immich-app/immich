declare namespace svelteHTML {
  interface HTMLAttributes {
    'on:pan'?: (event: CustomEvent) => void;
    'on:panend'?: (event: CustomEvent) => void;
    'on:pinch'?: (event: Customevent) => void;
    'on:pinchend'?: (event: CustomEvent) => void;
  }
}
