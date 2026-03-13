import RoleBadge from '$lib/components/spaces/role-badge.svelte';
import { render, screen } from '@testing-library/svelte';

describe('RoleBadge', () => {
  it('should render owner badge with data-testid', () => {
    render(RoleBadge, { role: 'owner' });
    expect(screen.getByTestId('role-badge-owner')).toBeInTheDocument();
  });

  it('should render editor badge with data-testid', () => {
    render(RoleBadge, { role: 'editor' });
    expect(screen.getByTestId('role-badge-editor')).toBeInTheDocument();
  });

  it('should render viewer badge with data-testid', () => {
    render(RoleBadge, { role: 'viewer' });
    expect(screen.getByTestId('role-badge-viewer')).toBeInTheDocument();
  });

  it('should display translated label for owner', () => {
    render(RoleBadge, { role: 'owner' });
    expect(screen.getByTestId('role-badge-owner')).toHaveTextContent('owner');
  });

  it('should display translated label for editor', () => {
    render(RoleBadge, { role: 'editor' });
    expect(screen.getByTestId('role-badge-editor')).toHaveTextContent('role_editor');
  });

  it('should display translated label for viewer', () => {
    render(RoleBadge, { role: 'viewer' });
    expect(screen.getByTestId('role-badge-viewer')).toHaveTextContent('role_viewer');
  });

  it('should apply filled styling for owner role', () => {
    render(RoleBadge, { role: 'owner' });
    const badge = screen.getByTestId('role-badge-owner');
    expect(badge.className).toContain('bg-primary');
    expect(badge.className).toContain('text-white');
  });

  it('should apply outlined styling for editor role', () => {
    render(RoleBadge, { role: 'editor' });
    const badge = screen.getByTestId('role-badge-editor');
    expect(badge.className).toContain('border');
    expect(badge.className).toContain('border-primary');
    expect(badge.className).toContain('text-primary');
  });

  it('should apply gray styling for viewer role', () => {
    render(RoleBadge, { role: 'viewer' });
    const badge = screen.getByTestId('role-badge-viewer');
    expect(badge.className).toContain('bg-gray-200');
    expect(badge.className).toContain('text-gray-600');
  });

  it('should use space color for owner filled style', () => {
    render(RoleBadge, { role: 'owner', spaceColor: 'blue' });
    const badge = screen.getByTestId('role-badge-owner');
    expect(badge.className).toContain('bg-blue-500');
  });

  it('should use space color for editor outlined style', () => {
    render(RoleBadge, { role: 'editor', spaceColor: 'blue' });
    const badge = screen.getByTestId('role-badge-editor');
    expect(badge.className).toContain('border-blue-500');
    expect(badge.className).toContain('text-blue-500');
  });

  it('should fall back to primary when spaceColor is null', () => {
    render(RoleBadge, { role: 'owner', spaceColor: null });
    const badge = screen.getByTestId('role-badge-owner');
    expect(badge.className).toContain('bg-primary');
  });

  it('should fall back to primary for unknown color', () => {
    render(RoleBadge, { role: 'owner', spaceColor: 'nonexistent' });
    const badge = screen.getByTestId('role-badge-owner');
    expect(badge.className).toContain('bg-primary');
  });

  it('should apply sm size classes', () => {
    render(RoleBadge, { role: 'owner', size: 'sm' });
    const badge = screen.getByTestId('role-badge-owner');
    expect(badge.className).toContain('px-2');
    expect(badge.className).toContain('py-0.5');
    expect(badge.className).toContain('text-xs');
  });

  it('should apply md size classes by default', () => {
    render(RoleBadge, { role: 'owner' });
    const badge = screen.getByTestId('role-badge-owner');
    expect(badge.className).toContain('px-2.5');
    expect(badge.className).toContain('text-xs');
  });

  it('should always have rounded-full and font-medium', () => {
    render(RoleBadge, { role: 'viewer' });
    const badge = screen.getByTestId('role-badge-viewer');
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('font-medium');
  });

  it('should ignore space color for viewer role (always gray)', () => {
    render(RoleBadge, { role: 'viewer', spaceColor: 'red' });
    const badge = screen.getByTestId('role-badge-viewer');
    expect(badge.className).toContain('bg-gray-200');
    expect(badge.className).not.toContain('bg-red');
  });
});
