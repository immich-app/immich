import { getAnimateMock } from '#lib/__mocks__/animate.mock.ts';
import { getIntersectionObserverMock } from '#lib/__mocks__/intersection-observer.mock.ts';
import { sdkMock } from '#lib/__mocks__/sdk.mock.ts';
import { getVisualViewportMock } from '#lib/__mocks__/visual-viewport.mock.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import AlbumPickerModal from './AlbumPickerModal.svelte';

describe('AlbumPickerModal component', () => {
  const onClose = vi.fn();

  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('#i18n/en.json'));
    await waitLocale('en-US');
  });

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  it('shows the singular selection count title when selectedItemsCount is 1', async () => {
    // Called by onMount()
    sdkMock.getAllAlbums.mockResolvedValueOnce([]);

    render(AlbumPickerModal, { props: { onClose, selectedItemsCount: 1 } });

    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(await screen.findByText('Add 1 item to album')).toBeInTheDocument();
    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(screen.queryByText('Select albums')).not.toBeInTheDocument();
  });

  it('shows the plural selection count title when selectedItemsCount is greater than 1', async () => {
    sdkMock.getAllAlbums.mockResolvedValueOnce([]);

    render(AlbumPickerModal, { props: { onClose, selectedItemsCount: 3 } });

    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(await screen.findByText('Add 3 items to album')).toBeInTheDocument();
    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(screen.queryByText('Select albums')).not.toBeInTheDocument();
  });

  it('shows the generic title when selectedItemsCount is not provided', async () => {
    sdkMock.getAllAlbums.mockResolvedValueOnce([]);

    render(AlbumPickerModal, { props: { onClose } });

    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(await screen.findByText('Select albums')).toBeInTheDocument();
    // @ts-expect-error pending a type fix: https://github.com/testing-library/jest-dom/pull/742/changes
    expect(screen.queryByText('Add 1 item to album')).not.toBeInTheDocument();
  });
});
