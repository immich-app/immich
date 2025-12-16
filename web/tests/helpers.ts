/* eslint-disable @typescript-eslint/no-explicit-any */
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { render } from '@testing-library/svelte';

export const renderWithTooltips = (component: any, props: any = {}) => {
  return render(TestWrapper, { component, componentProps: props } as any);
};
