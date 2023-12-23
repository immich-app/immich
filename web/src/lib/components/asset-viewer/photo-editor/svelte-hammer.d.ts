declare namespace svelteHTML {
  interface HTMLAttributes {
    'on:pan'?: (event: CustomEvent) => void;
    'on:pinch'?: (event: Customevent) => void;
  }
}
