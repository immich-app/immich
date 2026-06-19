import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { describe } from 'vitest';
import AlbumDescription from './AlbumDescription.svelte';

describe('AlbumDescription component', () => {
  it('shows an AutogrowTextarea component when isOwned is true', () => {
    render(AlbumDescription, { isOwned: true, id: '', description: '' });
    const autogrowTextarea = screen.getByTestId('autogrow-textarea');
    expect(autogrowTextarea).toBeInTheDocument();
  });

  it('does not show an AutogrowTextarea component when isOwned is false', () => {
    render(AlbumDescription, { isOwned: false, id: '', description: '' });
    const autogrowTextarea = screen.queryByTestId('autogrow-textarea');
    expect(autogrowTextarea).not.toBeInTheDocument();
  });
});
