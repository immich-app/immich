import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ShortcutsModal from './ShortcutsModal.svelte';

vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    authenticated: false,
    preferences: { ratings: { enabled: false } },
  },
}));

// Drain bits-ui Modal's deferred body-scroll-lock cleanup before happy-dom tears
// down `document`. Otherwise CI can report an unhandled `document is not defined`
// after all assertions in this file have passed.
afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
});

describe('ShortcutsModal', () => {
  it('uses the Gallery logo in the modal header', () => {
    render(ShortcutsModal, { props: { onClose: vi.fn() } });

    expect(screen.getByRole('img', { name: 'Gallery logo' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Immich logo' })).not.toBeInTheDocument();
  });
});
