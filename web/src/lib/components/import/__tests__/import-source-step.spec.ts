import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImportSourceStep from '../import-source-step.svelte';

describe('ImportSourceStep', () => {
  const onNext = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders Google Photos source card', () => {
    const { getByTestId } = render(ImportSourceStep, { props: { onNext } });
    expect(getByTestId('source-google')).toBeInTheDocument();
  });

  it('renders Apple Photos as disabled', () => {
    const { getByTestId } = render(ImportSourceStep, { props: { onNext } });
    expect(getByTestId('source-apple')).toHaveAttribute('aria-disabled', 'true');
  });

  it('has Google Photos selected by default', () => {
    const { getByTestId } = render(ImportSourceStep, { props: { onNext } });
    expect(getByTestId('source-google').className).toContain('border-primary');
  });

  it('calls onNext when Next clicked', async () => {
    const user = userEvent.setup();
    const { getByText } = render(ImportSourceStep, { props: { onNext } });

    await user.click(getByText('next'));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
