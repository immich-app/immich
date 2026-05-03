import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PersonRow from '../rows/person-row.svelte';

describe('person-row', () => {
  it('renders the person name and asset count', () => {
    render(PersonRow, {
      props: {
        item: { id: 'p1', name: 'Alice', numberOfAssets: 42 } as never,
      },
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/42 photos/)).toBeInTheDocument();
  });

  it('falls back to "Unnamed person" label when name is empty', () => {
    render(PersonRow, {
      props: { item: { id: 'p1', name: '' } as never },
    });
    expect(screen.getByText(/cmdk_unnamed_person|Unnamed/)).toBeInTheDocument();
  });

  it('renders the people thumbnail endpoint url', () => {
    const { container } = render(PersonRow, {
      props: { item: { id: 'p1', name: 'Alice' } as never },
    });
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toMatch(/\/api\/people\/p1\/thumbnail/);
  });

  it('renders the shared-space person thumbnail for space-primary rows', () => {
    const { container } = render(PersonRow, {
      props: {
        item: {
          id: 'space-person-1',
          name: 'Alice',
          primaryProfile: { type: 'space-person', id: 'space-person-1', spaceId: 'space-1' },
        } as never,
      },
    });
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toMatch(/\/api\/shared-spaces\/space-1\/people\/space-person-1\/thumbnail/);
  });

  it('swaps to placeholder div when the thumbnail image fails to load', async () => {
    const { container } = render(PersonRow, {
      props: { item: { id: 'p1', name: 'Alice' } as never },
    });
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    await fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('does NOT set role="option"', () => {
    const { container } = render(PersonRow, {
      props: { item: { id: 'p1', name: 'X' } as never },
    });
    expect(container.querySelector('[role="option"]')).toBeNull();
  });
});
