import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
import { render } from '@testing-library/svelte';

describe('ImageThumbnail component', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      value: true,
    });
  });

  it('shows thumbhash while image is loading', () => {
    const sut = render(ImageThumbnail, {
      url: 'http://localhost/img.png',
      altText: 'test',
      base64ThumbHash: '1QcSHQRnh493V4dIh4eXh1h4kJUI',
      widthStyle: '250px',
    });

    const thumbhash = sut.getByTestId('thumbhash');
    expect(thumbhash).not.toBeFalsy();
  });
});
