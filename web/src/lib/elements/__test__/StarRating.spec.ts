import { fireEvent, render } from '@testing-library/svelte';
import StarRating from '$lib/elements/StarRating.svelte';

describe('StarRating component', () => {
  it('renders correctly', () => {
    const component = render(StarRating, {
      count: 3,
      rating: 2,
      readOnly: false,
      onRating: vi.fn(),
    });
    const container = component.getByTestId('star-container') as HTMLImageElement;
    expect(container.className).toBe('flex flex-row');

    const radioButtons = component.getAllByRole('radio') as HTMLInputElement[];
    expect(radioButtons.length).toBe(3);
    const labels = component.getAllByTestId('star') as HTMLLabelElement[];
    expect(labels.length).toBe(3);
    const labelText = component.getAllByText('rating_count') as HTMLSpanElement[];
    expect(labelText.length).toBe(3);

    const rejectButton = component.getByTestId('reject-rating') as HTMLButtonElement;
    expect(rejectButton).toBeInTheDocument();
    expect(rejectButton.getAttribute('aria-pressed')).toBe('false');

    const clearButton = component.getByText('rating_clear') as HTMLButtonElement;
    expect(clearButton).toBeInTheDocument();

    // Check the initial state
    expect(radioButtons[0].checked).toBe(false);
    expect(radioButtons[1].checked).toBe(true);
    expect(radioButtons[2].checked).toBe(false);

    // Check the radio button attributes
    for (const [index, radioButton] of radioButtons.entries()) {
      expect(radioButton.id).toBe(labels[index].htmlFor);
      expect(radioButton.name).toBe('stars');
      expect(radioButton.value).toBe((index + 1).toString());
      expect(radioButton.disabled).toBe(false);
      expect(radioButton.className).toBe('sr-only');
    }

    // Check the label attributes
    for (const label of labels) {
      expect(label.className).toBe('cursor-pointer');
      expect(label.tabIndex).toBe(-1);
    }
  });

  it('renders correctly with readOnly', () => {
    const component = render(StarRating, {
      count: 3,
      rating: 2,
      readOnly: true,
      onRating: vi.fn(),
    });
    const radioButtons = component.getAllByRole('radio') as HTMLInputElement[];
    expect(radioButtons.length).toBe(3);
    const labels = component.getAllByTestId('star') as HTMLLabelElement[];
    expect(labels.length).toBe(3);

    const rejectButton = component.getByTestId('reject-rating') as HTMLButtonElement;
    expect(rejectButton.disabled).toBe(true);

    const clearButton = component.queryByText('rating_clear');
    expect(clearButton).toBeNull();

    // Check the initial state
    expect(radioButtons[0].checked).toBe(false);
    expect(radioButtons[1].checked).toBe(true);
    expect(radioButtons[2].checked).toBe(false);

    // Check the radio button attributes
    for (const [index, radioButton] of radioButtons.entries()) {
      expect(radioButton.id).toBe(labels[index].htmlFor);
      expect(radioButton.disabled).toBe(true);
    }

    // Check the label attributes
    for (const label of labels) {
      expect(label.className).toBe('');
    }
  });

  it('marks the reject button as pressed when rating is -1', () => {
    const component = render(StarRating, {
      count: 5,
      rating: -1,
      readOnly: false,
      onRating: vi.fn(),
    });

    const rejectButton = component.getByTestId('reject-rating') as HTMLButtonElement;
    expect(rejectButton.getAttribute('aria-pressed')).toBe('true');

    const radioButtons = component.getAllByRole('radio') as HTMLInputElement[];
    for (const radioButton of radioButtons) {
      expect(radioButton.checked).toBe(false);
    }
  });

  it('calls onRating(-1) when clicking the reject button on an unrated asset', async () => {
    const onRating = vi.fn();
    const component = render(StarRating, {
      count: 5,
      rating: null,
      readOnly: false,
      onRating,
    });

    const rejectButton = component.getByTestId('reject-rating') as HTMLButtonElement;
    await fireEvent.click(rejectButton);

    expect(onRating).toHaveBeenCalledWith(-1);
  });

  it('calls onRating(null) when clicking the reject button on an already-rejected asset', async () => {
    const onRating = vi.fn();
    const component = render(StarRating, {
      count: 5,
      rating: -1,
      readOnly: false,
      onRating,
    });

    const rejectButton = component.getByTestId('reject-rating') as HTMLButtonElement;
    await fireEvent.click(rejectButton);

    expect(onRating).toHaveBeenCalledWith(null);
  });

  it('does not call onRating when clicking the reject button while readOnly', async () => {
    const onRating = vi.fn();
    const component = render(StarRating, {
      count: 5,
      rating: null,
      readOnly: true,
      onRating,
    });

    const rejectButton = component.getByTestId('reject-rating') as HTMLButtonElement;
    await fireEvent.click(rejectButton);

    expect(onRating).not.toHaveBeenCalled();
  });
});
