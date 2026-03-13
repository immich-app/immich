import type { ImportProgress } from '$lib/managers/import-manager.svelte';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import ImportProgressStep from '../import-progress-step.svelte';

function makeProgress(overrides?: Partial<ImportProgress>): ImportProgress {
  return {
    imported: 25,
    skipped: 3,
    errors: 2,
    total: 100,
    currentFile: 'IMG_4567.jpg',
    currentAlbum: 'Vacation',
    albumsCreated: 2,
    errorLog: [],
    ...overrides,
  };
}

describe('ImportProgressStep', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows progress bar in importing mode', () => {
    const { getByTestId } = render(ImportProgressStep, {
      props: {
        progress: makeProgress(),
        total: 100,
        isPaused: false,
        isComplete: false,
        onTogglePause: vi.fn(),
      },
    });

    expect(getByTestId('import-progress-bar')).toBeInTheDocument();
  });

  it('shows status counters', () => {
    const { getByTestId } = render(ImportProgressStep, {
      props: {
        progress: makeProgress({ imported: 25, skipped: 3, errors: 2 }),
        total: 100,
        isPaused: false,
        isComplete: false,
        onTogglePause: vi.fn(),
      },
    });

    expect(getByTestId('status-imported')).toHaveTextContent('25');
    expect(getByTestId('status-skipped')).toHaveTextContent('3');
    expect(getByTestId('status-errors')).toHaveTextContent('2');
  });

  it('shows pause button', () => {
    const onTogglePause = vi.fn();
    const { getByTestId } = render(ImportProgressStep, {
      props: {
        progress: makeProgress(),
        total: 100,
        isPaused: false,
        isComplete: false,
        onTogglePause,
      },
    });

    expect(getByTestId('pause-button')).toBeInTheDocument();
  });

  it('shows completion state when isComplete', () => {
    const { getByText } = render(ImportProgressStep, {
      props: {
        progress: makeProgress({ imported: 95, skipped: 3, errors: 2, albumsCreated: 4 }),
        total: 100,
        isPaused: false,
        isComplete: true,
        onTogglePause: vi.fn(),
      },
    });

    expect(getByText('import_complete')).toBeInTheDocument();
  });

  it('shows View Photos/View Albums links in complete state', () => {
    const { getByText } = render(ImportProgressStep, {
      props: {
        progress: makeProgress({ imported: 95, skipped: 3, errors: 2, albumsCreated: 4 }),
        total: 100,
        isPaused: false,
        isComplete: true,
        onTogglePause: vi.fn(),
      },
    });

    expect(getByText('import_view_photos')).toBeInTheDocument();
    expect(getByText('import_view_albums')).toBeInTheDocument();
  });
});
