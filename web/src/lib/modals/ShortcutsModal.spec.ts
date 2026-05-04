import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ShortcutsModal from './ShortcutsModal.svelte';

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    authenticated: false,
    preferences: { ratings: { enabled: false } },
  },
}));

describe('ShortcutsModal', () => {
  it('uses the Gallery logo in the modal header', () => {
    render(ShortcutsModal, { props: { onClose: vi.fn() } });

    expect(screen.getByRole('img', { name: 'Gallery logo' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Immich logo' })).not.toBeInTheDocument();
  });
});
