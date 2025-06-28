import ContenteditableText from '$lib/components/shared-components/contenteditable-text.svelte';
import { render, screen } from '@testing-library/svelte';

describe('ContenteditableText component', () => {
  it('should render correctly', () => {
    render(ContenteditableText);
    const textarea = screen.getByTestId('contenteditable-text');
    expect(textarea).toBeInTheDocument();
  });

  it('should display given placeholder', () => {
    render(ContenteditableText, { placeholder: 'enter some text' });
    const textarea = screen.getByTestId('contenteditable-text');
    expect(textarea).toHaveAttribute('placeholder', 'enter some text');
  });

  // note: jsdom does not support contenteditable API, additional tests are done in e2e
});
