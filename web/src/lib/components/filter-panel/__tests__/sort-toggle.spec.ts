import { fireEvent, render } from '@testing-library/svelte';
import SortToggle from '../sort-toggle.svelte';

describe('SortToggle', () => {
  it('should show descending by default', () => {
    const { getByTestId } = render(SortToggle, {
      props: {
        sortOrder: 'desc',
        onToggle: () => {},
      },
    });

    const button = getByTestId('sort-toggle');
    expect(button).toBeTruthy();
    expect(button.getAttribute('title')).toBe('Sort: newest first');
  });

  it('should toggle direction on click', async () => {
    let toggled: 'asc' | 'desc' | undefined;
    const onToggle = (order: 'asc' | 'desc') => {
      toggled = order;
    };

    const { getByTestId } = render(SortToggle, {
      props: {
        sortOrder: 'desc',
        onToggle,
      },
    });

    await fireEvent.click(getByTestId('sort-toggle'));
    expect(toggled).toBe('asc');
  });

  it('should toggle from asc to desc', async () => {
    let toggled: 'asc' | 'desc' | undefined;
    const onToggle = (order: 'asc' | 'desc') => {
      toggled = order;
    };

    const { getByTestId } = render(SortToggle, {
      props: {
        sortOrder: 'asc',
        onToggle,
      },
    });

    const button = getByTestId('sort-toggle');
    expect(button.getAttribute('title')).toBe('Sort: oldest first');

    await fireEvent.click(button);
    expect(toggled).toBe('desc');
  });
});
