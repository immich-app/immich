import { render, screen } from '@testing-library/svelte';
import SpaceMap from './space-map.svelte';

describe('SpaceMap', () => {
  it('renders a map button that links to /map with spaceId query param', () => {
    render(SpaceMap, { spaceId: 'space-123' });

    const link = screen.getByRole('link', { name: 'map' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/map?spaceId=space-123');
  });
});
