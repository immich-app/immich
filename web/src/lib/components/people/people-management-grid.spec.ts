import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PeopleManagementGridWrapper from './people-management-grid.test-wrapper.svelte';

describe('PeopleManagementGrid', () => {
  it('renders shared person tiles with an editable canonical name footer', async () => {
    const onNameSubmit = vi.fn();
    render(PeopleManagementGridWrapper, { props: { onNameSubmit } });

    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute('href', '/people/person-1');

    const input = screen.getByDisplayValue('Ada Lovelace');
    await userEvent.clear(input);
    await userEvent.type(input, 'Ada Byron');
    await fireEvent.focusOut(input);

    await waitFor(() => {
      expect(onNameSubmit).toHaveBeenCalledWith('Ada Byron', expect.objectContaining({ id: 'person-1' }));
    });
  });

  it('renders readonly names when editing is disabled', () => {
    render(PeopleManagementGridWrapper, { props: { canEditNames: false } });

    expect(screen.queryByDisplayValue('Ada Lovelace')).not.toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('uses the shared tile action slot and can disable actions per page', async () => {
    const onAction = vi.fn();
    const { rerender } = render(PeopleManagementGridWrapper, {
      props: { canShowActions: false, onAction },
    });

    await fireEvent.mouseEnter(screen.getByRole('group'));
    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();

    await rerender({ canShowActions: true, onAction });
    await fireEvent.mouseEnter(screen.getByRole('group'));
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));

    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'person-1' }));
  });

  it('does not assign thumbnail src for deferred offscreen tiles', () => {
    class NeverIntersectingObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', NeverIntersectingObserver);

    render(PeopleManagementGridWrapper, {
      props: {
        deferThumbnails: true,
        people: Array.from({ length: 3 }, (_, index) => ({ id: `person-${index}`, name: `Person ${index}` })),
      },
    });

    expect(screen.getByTitle('Person 0')).not.toHaveAttribute('src');
    expect(screen.getByTitle('Person 1')).not.toHaveAttribute('src');
    expect(screen.getByTitle('Person 2')).not.toHaveAttribute('src');

    vi.unstubAllGlobals();
  });

  it('only starts the configured number of visible deferred thumbnails at once', async () => {
    let callback!: IntersectionObserverCallback;
    class VisibleObserver {
      observe = vi.fn((target: Element) => {
        callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      });
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
    }
    vi.stubGlobal('IntersectionObserver', VisibleObserver);

    render(PeopleManagementGridWrapper, {
      props: {
        deferThumbnails: true,
        thumbnailConcurrency: 2,
        people: Array.from({ length: 4 }, (_, index) => ({ id: `person-${index}`, name: `Person ${index}` })),
      },
    });

    await waitFor(() => {
      expect(screen.getByTitle('Person 0')).toHaveAttribute('src', '/api/people/person-0/thumbnail');
      expect(screen.getByTitle('Person 1')).toHaveAttribute('src', '/api/people/person-1/thumbnail');
    });
    expect(screen.getByTitle('Person 2')).not.toHaveAttribute('src');
    expect(screen.getByTitle('Person 3')).not.toHaveAttribute('src');

    await fireEvent.load(screen.getByTitle('Person 0'));
    await waitFor(() => {
      expect(screen.getByTitle('Person 2')).toHaveAttribute('src', '/api/people/person-2/thumbnail');
    });

    vi.unstubAllGlobals();
  });

  it('releases a deferred thumbnail slot when an image fails', async () => {
    let callback!: IntersectionObserverCallback;
    class VisibleObserver {
      observe = vi.fn((target: Element) => {
        callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      });
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
    }
    vi.stubGlobal('IntersectionObserver', VisibleObserver);

    render(PeopleManagementGridWrapper, {
      props: {
        deferThumbnails: true,
        thumbnailConcurrency: 1,
        people: [
          { id: 'person-1', name: 'Ada Lovelace' },
          { id: 'person-2', name: 'Grace Hopper' },
        ],
      },
    });

    await waitFor(() => expect(screen.getByTitle('Ada Lovelace')).toHaveAttribute('src'));
    expect(screen.getByTitle('Grace Hopper')).not.toHaveAttribute('src');
    await fireEvent.error(screen.getByTitle('Ada Lovelace'));
    await waitFor(() => expect(screen.getByTitle('Grace Hopper')).toHaveAttribute('src'));

    vi.unstubAllGlobals();
  });

  it('does not start every thumbnail at once when a new people page is appended', async () => {
    let callback!: IntersectionObserverCallback;
    class VisibleObserver {
      observe = vi.fn((target: Element) => {
        callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      });
      disconnect = vi.fn();
      unobserve = vi.fn();
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
    }
    vi.stubGlobal('IntersectionObserver', VisibleObserver);

    const { rerender } = render(PeopleManagementGridWrapper, {
      props: {
        deferThumbnails: true,
        thumbnailConcurrency: 2,
        people: [
          { id: 'person-1', name: 'Ada Lovelace' },
          { id: 'person-2', name: 'Grace Hopper' },
        ],
      },
    });
    await waitFor(() => expect(screen.getByTitle('Ada Lovelace')).toHaveAttribute('src'));
    await waitFor(() => expect(screen.getByTitle('Grace Hopper')).toHaveAttribute('src'));

    await rerender({
      deferThumbnails: true,
      thumbnailConcurrency: 2,
      people: [
        { id: 'person-1', name: 'Ada Lovelace' },
        { id: 'person-2', name: 'Grace Hopper' },
        { id: 'person-3', name: 'Katherine Johnson' },
        { id: 'person-4', name: 'Dorothy Vaughan' },
        { id: 'person-5', name: 'Mary Jackson' },
      ],
    });

    expect(screen.getByTitle('Katherine Johnson')).not.toHaveAttribute('src');
    expect(screen.getByTitle('Dorothy Vaughan')).not.toHaveAttribute('src');
    expect(screen.getByTitle('Mary Jackson')).not.toHaveAttribute('src');

    await fireEvent.load(screen.getByTitle('Ada Lovelace'));
    await waitFor(() => expect(screen.getByTitle('Katherine Johnson')).toHaveAttribute('src'));
    expect(screen.getByTitle('Mary Jackson')).not.toHaveAttribute('src');

    vi.unstubAllGlobals();
  });
});
