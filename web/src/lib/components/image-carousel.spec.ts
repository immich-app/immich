import { ImageCarousel } from '@immich/ui';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';

describe('ImageCarousel', () => {
  it('constrains long card titles inside the card', () => {
    render(ImageCarousel, {
      items: [
        {
          id: 'memory-id',
          title: 'Your recent trip to South Africa',
          href: '/memory?id=asset-id',
          src: '/thumbnail.jpg',
          alt: 'Trip photo',
        },
      ],
    });

    expect(screen.getByText('Your recent trip to South Africa')).toHaveClass(
      'w-[calc(100%-2rem)]',
      'whitespace-normal',
    );
  });
});
