import SpaceAssetLimitWarning from '$lib/components/spaces/space-asset-limit-warning.svelte';
import { render, screen } from '@testing-library/svelte';

describe('SpaceAssetLimitWarning', () => {
  it('should not render when selectedCount is within the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 5000 });
    expect(screen.queryByTestId('asset-limit-warning')).not.toBeInTheDocument();
  });

  it('should not render when selectedCount is exactly at the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 10_000 });
    expect(screen.queryByTestId('asset-limit-warning')).not.toBeInTheDocument();
  });

  it('should render warning when selectedCount exceeds the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 10_001 });
    expect(screen.getByTestId('asset-limit-warning')).toBeInTheDocument();
  });

  it('should render warning when selectedCount is way over the limit', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 100_000 });
    expect(screen.getByTestId('asset-limit-warning')).toBeInTheDocument();
  });

  it('should not render when selectedCount is 0', () => {
    render(SpaceAssetLimitWarning, { selectedCount: 0 });
    expect(screen.queryByTestId('asset-limit-warning')).not.toBeInTheDocument();
  });
});
