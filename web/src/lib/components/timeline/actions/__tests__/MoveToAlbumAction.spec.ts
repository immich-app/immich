import '@testing-library/jest-dom';
import { render, waitFor, type RenderResult } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { albumFactory } from '@test-data/factories/album-factory';
import MoveToAlbumAction from '../MoveToAlbumAction.svelte';

describe('MoveToAlbumAction component', () => {
  let sut: RenderResult<typeof MoveToAlbumAction>;
  const album = albumFactory.build({ id: 'source-album-id', albumName: 'Source Album' });

  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('renders a menu option with the label "Move to album"', () => {
    sut = render(MoveToAlbumAction, {
      album,
      onMove: vi.fn(),
      menuItem: true,
      assetIds: ['asset-1'],
    });

    const button = sut.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Move to album');
  });
});
