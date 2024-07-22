import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
import { render } from '@testing-library/svelte';

describe('ImageThumbnail component', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      value: vi.fn(),
    });
  });

  it('shows thumbhash while image is loading', () => {
    const sut = render(ImageThumbnail, {
      url: 'http://localhost/img.png',
      altText: 'test',
      thumbhash: '1QcSHQRnh493V4dIh4eXh1h4kJUI',
      widthStyle: '250px',
    });

    const [_, thumbhash] = sut.getAllByRole('img');
    expect(thumbhash.getAttribute('src')).toContain(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAgCAYAAAD5VeO1AAAMRklEQVR4AQBdAKL/', // truncated
    );
  });
});
