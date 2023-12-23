declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    'on:pan'?: (event: CustomEvent) => void;
    'on:pinch'?: (event: Customevent) => void;
  }
}