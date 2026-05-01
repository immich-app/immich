import type { TakeoutMediaItem } from '$lib/utils/google-takeout-parser';
import { scanTakeoutFiles } from '$lib/utils/google-takeout-scanner';
import { uploadTakeoutItem } from '$lib/utils/google-takeout-uploader';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImportWizard from '../import-wizard.svelte';

vi.mock('$lib/utils/google-takeout-scanner', () => ({
  scanTakeoutFiles: vi.fn(),
}));

vi.mock('$lib/utils/google-takeout-uploader', () => ({
  uploadTakeoutItem: vi.fn(),
  createImportAlbums: vi.fn(),
}));

describe('ImportWizard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders step indicator', () => {
    const { getByTestId } = render(ImportWizard);
    // Step indicator renders step-0 through step-4
    expect(getByTestId('step-0')).toBeInTheDocument();
    expect(getByTestId('step-4')).toBeInTheDocument();
  });

  it('renders source step initially', () => {
    const { getByTestId } = render(ImportWizard);
    // Source step shows Google source card
    expect(getByTestId('source-google')).toBeInTheDocument();
  });

  it('advances to files step when Next clicked on source', async () => {
    const user = userEvent.setup();
    const { getByText, getByTestId } = render(ImportWizard);

    // Click Next on source step
    await user.click(getByText('next'));

    // Should now show files step (drop zone)
    expect(getByTestId('drop-zone')).toBeInTheDocument();
  });

  it('imports name-only Takeout items', async () => {
    const user = userEvent.setup();
    const file = new File(['bytes'], 'IMG_001.jpg', { lastModified: 1_609_459_200_000 });
    const item: TakeoutMediaItem = {
      path: 'Takeout/Google Photos/Trip/IMG_001.jpg',
      name: 'IMG_001.jpg',
      size: file.size,
      lastModified: file.lastModified,
      getFile: () => Promise.resolve(file),
      metadata: undefined,
      albumName: undefined,
    };
    vi.mocked(scanTakeoutFiles).mockResolvedValue({
      items: [item],
      albums: [],
      stats: {
        totalMedia: 1,
        withLocation: 0,
        withDate: 0,
        favorites: 0,
        archived: 0,
        dateRange: undefined,
      },
    });
    vi.mocked(uploadTakeoutItem).mockResolvedValue({ assetId: 'asset-1', status: 'imported' });

    const { container, getByText, getByTestId } = render(ImportWizard);

    await user.click(getByText('next'));

    const zipInput = container.querySelector('input[type="file"][accept=".zip"]') as HTMLInputElement;
    await fireEvent.change(zipInput, {
      target: { files: [new File(['zip'], 'takeout.zip', { type: 'application/zip' })] },
    });
    await user.click(getByTestId('next-button'));

    await waitFor(() => expect(getByTestId('import-button')).toBeInTheDocument());
    await user.click(getByTestId('import-button'));

    await waitFor(() => expect(uploadTakeoutItem).toHaveBeenCalledOnce());
    expect(vi.mocked(uploadTakeoutItem).mock.calls[0][0]).toMatchObject({
      path: 'Takeout/Google Photos/Trip/IMG_001.jpg',
      name: 'IMG_001.jpg',
      size: file.size,
      lastModified: file.lastModified,
    });
  });
});
