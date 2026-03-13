import type { ScanProgress } from '$lib/utils/google-takeout-scanner';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImportScanStep from '../import-scan-step.svelte';

function makeScanProgress(overrides?: Partial<ScanProgress>): ScanProgress {
  return {
    currentFile: 'Takeout/Google Photos/Vacation/IMG_1234.jpg',
    currentZip: 'takeout-20240101.zip',
    zipIndex: 1,
    zipCount: 3,
    mediaCount: 42,
    withLocation: 30,
    withDate: 40,
    favorites: 5,
    archived: 2,
    albumNames: new Set(['Vacation', 'Family']),
    ...overrides,
  };
}

describe('ImportScanStep', () => {
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders scanning title', () => {
    const { getByText } = render(ImportScanStep, {
      props: { progress: makeScanProgress(), onCancel },
    });

    expect(getByText('import_scanning')).toBeInTheDocument();
  });

  it('shows current file being scanned', () => {
    const progress = makeScanProgress({ currentFile: 'Photos/beach.jpg' });
    const { getByText } = render(ImportScanStep, {
      props: { progress, onCancel },
    });

    expect(getByText('Photos/beach.jpg')).toBeInTheDocument();
  });

  it('shows media count', () => {
    const progress = makeScanProgress({ mediaCount: 42 });
    const { getByText } = render(ImportScanStep, {
      props: { progress, onCancel },
    });

    expect(getByText('42')).toBeInTheDocument();
  });

  it('cancel button calls onCancel', async () => {
    const user = userEvent.setup();
    const { getByText } = render(ImportScanStep, {
      props: { progress: makeScanProgress(), onCancel },
    });

    await user.click(getByText('cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
