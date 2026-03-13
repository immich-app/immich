import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
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
});
