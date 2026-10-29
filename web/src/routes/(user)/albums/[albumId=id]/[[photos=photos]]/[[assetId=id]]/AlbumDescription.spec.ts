import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { describe } from 'vitest';
import AlbumDescription from './AlbumDescription.svelte';

describe('AlbumDescription component', () => {
  it('shows an AutogrowTextarea component when isOwned is true', () => {
    render(AlbumDescription, { isEditor: true, id: '', description: '' });
    const autogrowTextarea = screen.getByTestId('autogrow-textarea');
    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(autogrowTextarea).toBeInTheDocument();
  });

  it('does not show an AutogrowTextarea component when isOwned is false', () => {
    render(AlbumDescription, { isEditor: false, id: '', description: '' });
    const autogrowTextarea = screen.queryByTestId('autogrow-textarea');
    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(autogrowTextarea).not.toBeInTheDocument();
  });
});
