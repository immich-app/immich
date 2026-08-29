import './immich-rendition-menu';

describe('ImmichRenditionMenu', () => {
  it('labels only the Original rendition', () => {
    const menu = document.createElement('immich-rendition-menu') as HTMLElement & {
      formatRendition: (rendition: { bitrate: number; height: number; id: string; width: number }) => string;
    };
    menu.setAttribute('original-rendition-id', '15');

    expect(menu.formatRendition({ id: '15', width: 3840, height: 2160, bitrate: 100_000_000 })).toBe('Original');
    expect(menu.formatRendition({ id: '14', width: 3840, height: 2160, bitrate: 25_000_000 })).toBe('2160p');
  });

  it('labels automatic selection as Auto', () => {
    const menu = document.createElement('immich-rendition-menu') as HTMLElement & {
      formatMenuItemText: (text: string) => string;
    };

    expect(menu.formatMenuItemText('Auto (2160p)')).toBe('Auto');
  });
});
