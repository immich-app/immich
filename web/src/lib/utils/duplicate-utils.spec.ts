import { getAllMetadataItems } from '$lib/utils/duplicate-utils';
import { assetFactory } from '@test-data/factories/asset-factory';

/**
 * The duplicate review rows shorten a long path to fit, and the row's own `title` attribute is the
 * field LABEL — so hovering a shortened path showed the word "Path". The value that was cut had no
 * way back on screen, and choosing between two duplicates is usually exactly the part that was cut.
 */

const $t = ((key: string) => key) as never;

const itemFor = (asset: Parameters<typeof getAllMetadataItems>[0], title: string) =>
  getAllMetadataItems(asset, $t, 'en').find((item) => item.title === title);

describe('getAllMetadataItems', () => {
  it('carries the full path even when the displayed one is shortened', () => {
    const originalPath = '/mnt/media/photos/library/2024/holidays/iceland/day-07-jokulsarlon/DSC_0912_edited_final.jpg';
    const asset = assetFactory.build({ originalPath });

    const item = itemFor(asset, 'path');

    expect(item?.tooltip).toBe(originalPath);
    // The row still shows the shortened form; this fix restores access, it does not widen the row.
    expect(item?.render).not.toBe(originalPath);
    expect(item?.render.length).toBeLessThan(originalPath.length);
  });

  it('leaves a path short enough to display without a redundant tooltip difference', () => {
    const originalPath = '/photos/a.jpg';
    const asset = assetFactory.build({ originalPath });

    const item = itemFor(asset, 'path');

    expect(item?.render).toBe(originalPath);
    expect(item?.tooltip).toBe(originalPath);
  });

  it('offers no tooltip for a field that is never shortened', () => {
    // Only the path opts in. A tooltip repeating a value that is already fully visible is noise,
    // and it would also override the row label tooltip for no reason.
    const asset = assetFactory.build({ originalFileName: 'a.jpg' });

    expect(itemFor(asset, 'file_name_text')?.tooltip).toBeUndefined();
    expect(itemFor(asset, 'file_size')?.tooltip).toBeUndefined();
  });

  it('has no path tooltip when the asset has no path', () => {
    // `render` falls back to "unknown" here, and a tooltip of an empty string would leave the
    // browser showing an empty box on hover.
    const asset = assetFactory.build({ originalPath: '' });

    expect(itemFor(asset, 'path')?.tooltip).toBeUndefined();
  });
});
