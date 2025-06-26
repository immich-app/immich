import AlbumDescription from '$lib/components/album-page/album-description.svelte';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { describe } from 'vitest';

describe('AlbumDescription component', () => {
  it('shows an ContenteditableText component when isOwned is true', () => {
    render(AlbumDescription, { isOwned: true, id: '', description: '' });
    const contenteditableText = screen.getByTestId('contenteditable-text');
    expect(contenteditableText).toBeInTheDocument();
  });

  it('does not show an ContenteditableText component when isOwned is false', () => {
    render(AlbumDescription, { isOwned: false, id: '', description: '' });
    const contenteditableText = screen.queryByTestId('contenteditable-text');
    expect(contenteditableText).not.toBeInTheDocument();
  });
});
