import sharp from 'sharp';
import { SeededRandom } from 'src/generators/timeline/utils';

export const randomThumbnail = async (seed: string, ratio: number) => {
  const height = 235;
  const width = Math.round(height * ratio);
  return randomImageFromString(seed, { width, height });
};

export const randomPreview = async (seed: string, ratio: number) => {
  const height = 500;
  const width = Math.round(height * ratio);
  return randomImageFromString(seed, { width, height });
};

export const randomImageFromString = async (
  seed: string = '',
  { width = 100, height = 100 }: { width: number; height: number },
) => {
  // Convert string to number for seeding
  let seedNumber = 0;
  for (let i = 0; i < seed.length; i++) {
    seedNumber = (seedNumber << 5) - seedNumber + (seed.codePointAt(i) ?? 0);
    seedNumber = seedNumber & seedNumber; // Convert to 32bit integer
  }
  return randomImage(new SeededRandom(Math.abs(seedNumber)), { width, height });
};

export const randomImage = async (rng: SeededRandom, { width, height }: { width: number; height: number }) => {
  const r1 = rng.nextInt(0, 256);
  const g1 = rng.nextInt(0, 256);
  const b1 = rng.nextInt(0, 256);
  const r2 = rng.nextInt(0, 256);
  const g2 = rng.nextInt(0, 256);
  const b2 = rng.nextInt(0, 256);
  const patternType = rng.nextInt(0, 5);

  let svgPattern = '';

  switch (patternType) {
    case 0: {
      // Solid color
      svgPattern = `<svg width="${width}" height="${height}">
        <rect x="0" y="0" width="${width}" height="${height}" fill="rgb(${r1},${g1},${b1})"/>
      </svg>`;
      break;
    }

    case 1: {
      // Horizontal stripes
      const stripeHeight = 10;
      svgPattern = `<svg width="${width}" height="${height}">
        ${Array.from(
          { length: height / stripeHeight },
          (_, i) =>
            `<rect x="0" y="${i * stripeHeight}" width="${width}" height="${stripeHeight}"
            fill="rgb(${i % 2 ? r1 : r2},${i % 2 ? g1 : g2},${i % 2 ? b1 : b2})"/>`,
        ).join('')}
      </svg>`;
      break;
    }

    case 2: {
      // Vertical stripes
      const stripeWidth = 10;
      svgPattern = `<svg width="${width}" height="${height}">
        ${Array.from(
          { length: width / stripeWidth },
          (_, i) =>
            `<rect x="${i * stripeWidth}" y="0" width="${stripeWidth}" height="${height}"
            fill="rgb(${i % 2 ? r1 : r2},${i % 2 ? g1 : g2},${i % 2 ? b1 : b2})"/>`,
        ).join('')}
      </svg>`;
      break;
    }

    case 3: {
      // Checkerboard
      const squareSize = 10;
      svgPattern = `<svg width="${width}" height="${height}">
        ${Array.from({ length: height / squareSize }, (_, row) =>
          Array.from({ length: width / squareSize }, (_, col) => {
            const isEven = (row + col) % 2 === 0;
            return `<rect x="${col * squareSize}" y="${row * squareSize}"
              width="${squareSize}" height="${squareSize}"
              fill="rgb(${isEven ? r1 : r2},${isEven ? g1 : g2},${isEven ? b1 : b2})"/>`;
          }).join(''),
        ).join('')}
      </svg>`;
      break;
    }

    case 4: {
      // Diagonal stripes
      svgPattern = `<svg width="${width}" height="${height}">
        <defs>
          <pattern id="diagonal" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="10" height="20" fill="rgb(${r1},${g1},${b1})"/>
            <rect x="10" y="0" width="10" height="20" fill="rgb(${r2},${g2},${b2})"/>
          </pattern>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height}" fill="url(#diagonal)" transform="rotate(45 50 50)"/>
      </svg>`;
      break;
    }
  }

  const svgBuffer = Buffer.from(svgPattern);
  const jpegData = await sharp(svgBuffer).jpeg({ quality: 50 }).toBuffer();
  return jpegData;
};
