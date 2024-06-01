import AutogrowTextarea from '$lib/components/shared-components/autogrow-textarea.svelte';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

describe('AutogrowTextarea component', () => {
  const getTextarea = () => screen.getByTestId('autogrow-textarea') as HTMLTextAreaElement;

  it('should render correctly', () => {
    render(AutogrowTextarea);
    const textarea = getTextarea();
    expect(textarea).toBeInTheDocument();
  });

  it('should show the content passed to the component', () => {
    render(AutogrowTextarea, { content: 'stuff' });
    const textarea = getTextarea();
    expect(textarea.value).toBe('stuff');
  });

  it('should show the placeholder passed to the component', () => {
    render(AutogrowTextarea, { placeholder: 'asdf' });
    const textarea = getTextarea();
    expect(textarea.placeholder).toBe('asdf');
  });

  it('should execute the passed callback on blur', async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    render(AutogrowTextarea, { content: 'existing', onContentUpdate: update });
    const textarea = getTextarea();
    await user.click(textarea);
    await user.keyboard('extra');
    textarea.blur();
    await waitFor(() => expect(update).toHaveBeenCalledWith('existingextra'));
  });

  it('should execute the passed callback when pressing ctrl+enter in the textarea', async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    render(AutogrowTextarea, { onContentUpdate: update });
    const textarea = getTextarea();
    await user.click(textarea);
    const string = 'content';
    await user.keyboard(string);
    await user.keyboard('{Control>}{Enter}{/Control}');
    await waitFor(() => expect(update).toHaveBeenCalledWith(string));
  });

  it('should not execute the passed callback if the text has not changed', async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    render(AutogrowTextarea, { content: 'initial', onContentUpdate: update });
    const textarea = getTextarea();
    await user.click(textarea);
    await user.clear(textarea);
    await user.keyboard('initial');
    await user.keyboard('{Control>}{Enter}{/Control}');
    await waitFor(() => expect(update).not.toHaveBeenCalled());
  });
});
