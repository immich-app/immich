import TypedSearchTokenRail from '$lib/components/global-search/typed-search-token-rail.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('TypedSearchTokenRail', () => {
  it('renders recognized and pending tokens quietly', () => {
    render(TypedSearchTokenRail, {
      props: {
        tokens: [
          { raw: 'from:2025', key: 'from', value: '2025', status: 'recognized' },
          { raw: 'person:anna', key: 'person', value: 'anna', status: 'pending-entity' },
        ],
      },
    });

    expect(screen.getByText('from')).toBeVisible();
    expect(screen.getByText('2025')).toBeVisible();
    expect(screen.getByText('person')).toBeVisible();
    expect(screen.getByText('anna')).toBeVisible();
    expect(screen.getByTestId('typed-search-token-person')).toHaveAttribute('data-status', 'pending-entity');
  });

  it('gives filter chips breathing room below the input row', () => {
    render(TypedSearchTokenRail, {
      props: {
        tokens: [{ raw: 'person:anna', key: 'person', value: 'anna', status: 'pending-entity' }],
      },
    });

    expect(screen.getByTestId('typed-search-token-rail')).toHaveClass('px-4', 'pt-2', 'pb-1');
  });

  it('renders typed filters as substantial key-value capsules', () => {
    render(TypedSearchTokenRail, {
      props: {
        tokens: [{ raw: 'person:anna', key: 'person', value: 'anna', status: 'pending-entity' }],
      },
    });

    expect(screen.getByTestId('typed-search-token-person')).toHaveClass(
      'min-h-7',
      'overflow-hidden',
      'rounded-full',
      'text-xs',
    );
    expect(screen.getByTestId('typed-search-token-person-key')).toHaveClass('uppercase', 'tracking-[0.08em]');
    expect(screen.getByTestId('typed-search-token-person-value')).toHaveClass('px-2.5', 'py-1.5');
  });

  it('renders error tokens with issue text', () => {
    render(TypedSearchTokenRail, {
      props: {
        tokens: [
          {
            raw: 'person:anna',
            key: 'person',
            value: 'anna',
            status: 'error',
            issue: {
              code: 'no-match',
              raw: 'person:anna',
              key: 'person',
              value: 'anna',
              message: 'No person found for "anna"',
            },
          },
        ],
      },
    });

    expect(screen.getByTestId('typed-search-token-person')).toHaveAttribute('data-status', 'error');
    expect(screen.getByLabelText('No person found for "anna"')).toBeInTheDocument();
  });
});
