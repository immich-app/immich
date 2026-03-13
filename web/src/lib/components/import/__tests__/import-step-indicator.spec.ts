import { ImportStep } from '$lib/managers/import-manager.svelte';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import ImportStepIndicator from '../import-step-indicator.svelte';

describe('ImportStepIndicator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders all step labels', () => {
    const { getByText } = render(ImportStepIndicator, { props: { currentStep: ImportStep.Source } });

    expect(getByText('import_step_source')).toBeInTheDocument();
    expect(getByText('import_step_files')).toBeInTheDocument();
    expect(getByText('import_step_scan')).toBeInTheDocument();
    expect(getByText('import_step_review')).toBeInTheDocument();
    expect(getByText('import_step_import')).toBeInTheDocument();
  });

  it('marks current step as active', () => {
    const { getByTestId } = render(ImportStepIndicator, { props: { currentStep: ImportStep.Scan } });

    const activeStep = getByTestId('step-2');
    expect(activeStep.querySelector('.bg-primary')).toBeInTheDocument();
  });

  it('marks previous steps as completed', () => {
    const { getByTestId } = render(ImportStepIndicator, { props: { currentStep: ImportStep.Review } });

    expect(getByTestId('step-0')).toHaveAttribute('data-completed', 'true');
    expect(getByTestId('step-1')).toHaveAttribute('data-completed', 'true');
    expect(getByTestId('step-2')).toHaveAttribute('data-completed', 'true');
  });

  it('marks future steps as inactive', () => {
    const { getByTestId } = render(ImportStepIndicator, { props: { currentStep: ImportStep.Files } });

    expect(getByTestId('step-2')).toHaveAttribute('data-completed', 'false');
    expect(getByTestId('step-3')).toHaveAttribute('data-completed', 'false');
    expect(getByTestId('step-4')).toHaveAttribute('data-completed', 'false');
  });
});
