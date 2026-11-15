import TestWrapper from '#lib/components/TestWrapper.svelte';
import { type Component } from 'svelte';
import { render } from 'vitest-browser-svelte';

export const renderWithTooltips = <T extends Record<string, unknown>, K extends Component<T>>(component: K, props: T) =>
  render(TestWrapper as Component<{ component: K; componentProps: T }>, { component, componentProps: props });
