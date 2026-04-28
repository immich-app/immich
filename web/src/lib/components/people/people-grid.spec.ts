import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import PeopleGridWrapper from './people-grid.test-wrapper.svelte';

type ObserverEntry = Pick<IntersectionObserverEntry, 'target' | 'isIntersecting'>;

const observerInstances: ControllableIntersectionObserver[] = [];
let nextAnimationFrameId = 1;
let pendingAnimationFrames = new Map<number, FrameRequestCallback>();

class ControllableIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds = [];
  readonly disconnect = vi.fn();
  readonly observe = vi.fn((target: Element) => {
    this.observedTarget = target;
  });
  readonly takeRecords = vi.fn(() => []);
  readonly unobserve = vi.fn();
  observedTarget?: Element;

  constructor(private readonly callback: IntersectionObserverCallback) {
    observerInstances.push(this);
  }

  trigger(entry: ObserverEntry) {
    this.callback([entry as IntersectionObserverEntry], this);
  }
}

describe('PeopleGrid', () => {
  beforeEach(() => {
    observerInstances.length = 0;
    nextAnimationFrameId = 1;
    pendingAnimationFrames = new Map();
    vi.stubGlobal('IntersectionObserver', ControllableIntersectionObserver);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextAnimationFrameId++;
      pendingAnimationFrames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => pendingAnimationFrames.delete(id));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: window.innerHeight + 1,
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const flushAnimationFrames = () => {
    const callbacks = [...pendingAnimationFrames.values()];
    pendingAnimationFrames.clear();
    for (const callback of callbacks) {
      callback(0);
    }
  };

  it('renders items through the child snippet', () => {
    render(PeopleGridWrapper, {
      props: {
        items: [
          { id: 'p1', label: 'Alice' },
          { id: 'p2', label: 'Bob' },
        ],
        loadNextPage: vi.fn(),
      },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows loading text when loading the next page', () => {
    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loading: true,
        loadNextPage: vi.fn(),
      },
    });

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.getByText('loading')).toHaveAttribute('aria-live', 'polite');
  });

  it('calls loadNextPage when the sentinel intersects while more pages are available', () => {
    const loadNextPage = vi.fn();
    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loadNextPage,
      },
    });

    observerInstances[0].trigger({
      target: observerInstances[0].observedTarget!,
      isIntersecting: true,
    });

    expect(loadNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not call loadNextPage when the sentinel is not intersecting', () => {
    const loadNextPage = vi.fn();
    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loadNextPage,
      },
    });

    observerInstances[0].trigger({
      target: observerInstances[0].observedTarget!,
      isIntersecting: false,
    });

    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('does not call loadNextPage while loading', () => {
    const loadNextPage = vi.fn();
    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loading: true,
        loadNextPage,
      },
    });

    observerInstances[0].trigger({
      target: observerInstances[0].observedTarget!,
      isIntersecting: true,
    });

    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('calls loadNextPage after render when the sentinel is still visible', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: window.innerHeight - 1,
    } as DOMRect);
    const loadNextPage = vi.fn();

    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loadNextPage,
      },
    });

    flushAnimationFrames();

    await waitFor(() => expect(loadNextPage).toHaveBeenCalledTimes(1));
  });

  it('calls loadNextPage after items grow when the sentinel remains visible', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: window.innerHeight - 1,
    } as DOMRect);
    const loadNextPage = vi.fn();

    const { rerender } = render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loading: true,
        loadNextPage,
      },
    });

    expect(loadNextPage).not.toHaveBeenCalled();

    await rerender({
      items: [
        { id: 'p1', label: 'Alice' },
        { id: 'p2', label: 'Bob' },
      ],
      hasNextPage: true,
      loading: false,
      loadNextPage,
    });

    flushAnimationFrames();

    await waitFor(() => expect(loadNextPage).toHaveBeenCalledTimes(1));
  });

  it('does not call loadNextPage from the visibility re-check while loading', () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: window.innerHeight - 1,
    } as DOMRect);
    const loadNextPage = vi.fn();

    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loading: true,
        loadNextPage,
      },
    });

    flushAnimationFrames();

    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('does not retry the visibility re-check when loading finishes without new items', async () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: window.innerHeight - 1,
    } as DOMRect);
    const loadNextPage = vi.fn();

    const { rerender } = render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loading: true,
        loadNextPage,
      },
    });

    await rerender({
      items: [{ id: 'p1', label: 'Alice' }],
      hasNextPage: true,
      loading: false,
      loadNextPage,
    });

    flushAnimationFrames();

    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('does not call loadNextPage twice when intersection fires before a pending visibility re-check', () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
      top: window.innerHeight - 1,
    } as DOMRect);
    const loadNextPage = vi.fn();

    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loadNextPage,
      },
    });

    observerInstances[0].trigger({
      target: observerInstances[0].observedTarget!,
      isIntersecting: true,
    });
    flushAnimationFrames();

    expect(loadNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not observe or call loadNextPage when there are no more pages', () => {
    const loadNextPage = vi.fn();
    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: false,
        loadNextPage,
      },
    });

    expect(observerInstances).toHaveLength(0);
    expect(loadNextPage).not.toHaveBeenCalled();
  });

  it('disconnects the observer when pagination is no longer available', async () => {
    const { rerender } = render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loadNextPage: vi.fn(),
      },
    });
    const observer = observerInstances[0];

    await rerender({
      items: [{ id: 'p1', label: 'Alice' }],
      hasNextPage: false,
      loadNextPage: vi.fn(),
    });

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('renders without IntersectionObserver support', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    render(PeopleGridWrapper, {
      props: {
        items: [{ id: 'p1', label: 'Alice' }],
        hasNextPage: true,
        loadNextPage: vi.fn(),
      },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
