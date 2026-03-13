import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImportFilesStep from '../import-files-step.svelte';

function makeFile(name: string, size: number): File {
  return new File(['x'.repeat(size)], name, { type: 'application/zip' });
}

describe('ImportFilesStep', () => {
  const defaultProps = {
    files: [] as File[],
    totalSize: 0,
    onAddFiles: vi.fn(),
    onClearFiles: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows drop zone when no files selected', () => {
    const { getByTestId } = render(ImportFilesStep, { props: defaultProps });
    expect(getByTestId('drop-zone')).toBeInTheDocument();
  });

  it('shows file list when files selected', () => {
    const files = [makeFile('takeout-1.zip', 1024), makeFile('takeout-2.zip', 2048)];
    const { getByText } = render(ImportFilesStep, {
      props: { ...defaultProps, files, totalSize: 3072 },
    });

    expect(getByText('takeout-1.zip')).toBeInTheDocument();
    expect(getByText('takeout-2.zip')).toBeInTheDocument();
  });

  it('disables Next when no files selected', () => {
    const { getByTestId } = render(ImportFilesStep, { props: defaultProps });
    expect(getByTestId('next-button')).toBeDisabled();
  });

  it('enables Next when files selected', () => {
    const files = [makeFile('takeout.zip', 1024)];
    const { getByTestId } = render(ImportFilesStep, {
      props: { ...defaultProps, files, totalSize: 1024 },
    });

    expect(getByTestId('next-button')).not.toBeDisabled();
  });

  it('calls onBack when Back clicked', async () => {
    const user = userEvent.setup();
    const { getByText } = render(ImportFilesStep, { props: defaultProps });

    await user.click(getByText('back'));
    expect(defaultProps.onBack).toHaveBeenCalledOnce();
  });

  it('calls onClearFiles when Clear clicked', async () => {
    const user = userEvent.setup();
    const files = [makeFile('takeout.zip', 1024)];
    const { getByText } = render(ImportFilesStep, {
      props: { ...defaultProps, files, totalSize: 1024 },
    });

    await user.click(getByText('import_clear'));
    expect(defaultProps.onClearFiles).toHaveBeenCalledOnce();
  });
});
