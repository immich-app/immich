import TestWrapper from '$lib/components/TestWrapper.svelte';
import { render, type RenderResult } from '@testing-library/svelte';
import { type Component } from 'svelte';

export const renderWithTooltips = <T extends Record<string, unknown>, K extends Component<T>>(
  component: K,
  props: T,
) => {
  return render(TestWrapper as Component<{ component: K; componentProps: T }>, {
    component,
    componentProps: props,
  }) as unknown as RenderResult<K>;
};
