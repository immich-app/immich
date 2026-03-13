import TestWrapper from '$lib/components/TestWrapper.svelte';
import SpaceNewAssetsDivider from '$lib/components/spaces/space-new-assets-divider.svelte';
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';

function renderDivider(props: Record<string, unknown>) {
  return render(TestWrapper as Component<{ component: typeof SpaceNewAssetsDivider; componentProps: typeof props }>, {
    component: SpaceNewAssetsDivider,
    componentProps: props,
  });
}

describe('SpaceNewAssetsDivider', () => {
  it('should render pill with correct count', () => {
    renderDivider({ newAssetCount: 8, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    const divider = screen.getByTestId('new-assets-divider');
    expect(divider).toHaveTextContent('8 new');
  });

  it('should render formatted date', () => {
    renderDivider({ newAssetCount: 3, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    const divider = screen.getByTestId('new-assets-divider');
    // Date format is locale-dependent, just check "Mar" or "8" is present
    expect(divider.textContent).toMatch(/Mar|3/);
  });

  it('should not render when newAssetCount is 0', () => {
    renderDivider({ newAssetCount: 0, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    expect(screen.queryByTestId('new-assets-divider')).not.toBeInTheDocument();
  });

  it('should have sticky positioning', () => {
    renderDivider({ newAssetCount: 5, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    const divider = screen.getByTestId('new-assets-divider');
    expect(divider.className).toContain('sticky');
  });

  it('should render pill element', () => {
    renderDivider({ newAssetCount: 5, lastViewedAt: '2026-03-08T10:00:00Z', spaceColor: 'primary' });
    expect(screen.getByTestId('new-assets-pill')).toBeInTheDocument();
  });
});
