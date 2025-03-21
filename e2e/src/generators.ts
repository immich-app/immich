import { PNG } from 'pngjs';


const createPNG = (r: number, g: number, b: number) => {
  console.log('create')
  const image = new PNG({ width: 255, height: 255 });

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {

      const idx = (image.width * y + x) << 2;
      image.data[idx] = ((r + y) % 255); // red
      image.data[idx + 1] = ((g + y) % 255);// green
      image.data[idx + 2] = ((b + y) % 255); // blue
      image.data[idx + 3] = 255;
    }
  }

  return PNG.sync.write(image);
};

function* newPngFactory() {
  for (let r = 0; r < 255; r++) {
    for (let g = 0; g < 255; g++) {
      for (let b = 0; b < 255; b++) {
        yield createPNG(r, g, b);
      }
    }
  }
}

const pngFactory = newPngFactory();

export const makeRandomImage = () => {
  const { value } = pngFactory.next();
  if (!value) {
    throw new Error('Ran out of random asset data');
  }

  return value;
};
