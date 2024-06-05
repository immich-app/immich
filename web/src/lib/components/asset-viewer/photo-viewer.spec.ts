import * as utils from '$lib/utils';
import type { AssetResponseDto } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import type { Mock, MockInstance } from 'vitest';
import PhotoViewer from './photo-viewer.svelte';

vi.mock('$lib/utils', async (originalImport) => {
  const meta = await originalImport<typeof import('$lib/utils')>();
  return {
    ...meta,
    downloadRequest: vi.fn(),
  };
});

describe('PhotoViewer component', () => {
  let downloadRequestMock: MockInstance;
  let createObjectURLMock: Mock<[obj: Blob], string>;
  let asset: AssetResponseDto;

  beforeAll(() => {
    downloadRequestMock = vi.spyOn(utils, 'downloadRequest').mockResolvedValue({
      data: new Blob(),
      status: 200,
    });
    createObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    asset = assetFactory.build({ originalPath: 'image.png' });
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  it('initially shows a loading spinner', () => {
    render(PhotoViewer, { asset });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('loads and shows a photo', async () => {
    createObjectURLMock.mockReturnValueOnce('url-one');
    render(PhotoViewer, { asset });

    expect(downloadRequestMock).toBeCalledWith(
      expect.objectContaining({
        url: `/api/assets/${asset.id}/thumbnail?size=preview&c=${asset.checksum}`,
      }),
    );
    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument());
    expect(screen.getByRole('img')).toHaveAttribute('src', 'url-one');
  });

  it('loads high resolution photo when zoomed', async () => {
    createObjectURLMock.mockReturnValueOnce('url-one');
    render(PhotoViewer, { asset });
    createObjectURLMock.mockReturnValueOnce('url-two');

    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument());
    await fireEvent(window, new CustomEvent('zoomImage'));
    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'url-two'));
    expect(downloadRequestMock).toBeCalledWith(
      expect.objectContaining({
        url: `/api/assets/${asset.id}/original?c=${asset.checksum}`,
      }),
    );
  });

  it('reloads photo when checksum changes', async () => {
    const { component } = render(PhotoViewer, { asset });
    createObjectURLMock.mockReturnValueOnce('url-two');

    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument());
    component.$set({ asset: { ...asset, checksum: 'new-checksum' } });

    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'url-two'));
    expect(downloadRequestMock).toBeCalledWith(
      expect.objectContaining({
        url: `/api/assets/${asset.id}/thumbnail?size=preview&c=new-checksum`,
      }),
    );
  });
});
