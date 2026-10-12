import { scaleToCover, scaleToFit } from '$lib/utils/container-utils';

describe('scaleToFit', () => {
  const tests = [
    {
      name: 'landscape image in square container',
      dimensions: { width: 2000, height: 1000 },
      container: { width: 500, height: 500 },
      expected: { width: 500, height: 250 },
    },
    {
      name: 'portrait image in square container',
      dimensions: { width: 1000, height: 2000 },
      container: { width: 500, height: 500 },
      expected: { width: 250, height: 500 },
    },
    {
      name: 'square image in square container',
      dimensions: { width: 1000, height: 1000 },
      container: { width: 500, height: 500 },
      expected: { width: 500, height: 500 },
    },
    {
      name: 'landscape image in landscape container',
      dimensions: { width: 1600, height: 900 },
      container: { width: 800, height: 600 },
      expected: { width: 800, height: 450 },
    },
    {
      name: 'portrait image in portrait container',
      dimensions: { width: 900, height: 1600 },
      container: { width: 600, height: 800 },
      expected: { width: 450, height: 800 },
    },
    {
      name: 'image matches container exactly',
      dimensions: { width: 500, height: 300 },
      container: { width: 500, height: 300 },
      expected: { width: 500, height: 300 },
    },
    {
      name: 'image smaller than container scales up',
      dimensions: { width: 100, height: 50 },
      container: { width: 400, height: 400 },
      expected: { width: 400, height: 200 },
    },
  ];

  for (const { name, dimensions, container, expected } of tests) {
    it(`should handle ${name}`, () => {
      expect(scaleToFit(dimensions, container)).toEqual(expected);
    });
  }

  const unmeasurable = [
    { name: 'zero width and height', dimensions: { width: 0, height: 0 } },
    { name: 'zero width', dimensions: { width: 0, height: 1000 } },
    { name: 'zero height', dimensions: { width: 1000, height: 0 } },
  ];

  for (const { name, dimensions } of unmeasurable) {
    it(`should return an empty size for ${name}`, () => {
      expect(scaleToFit(dimensions, { width: 500, height: 500 })).toEqual({ width: 0, height: 0 });
      expect(scaleToCover(dimensions, { width: 500, height: 500 })).toEqual({ width: 0, height: 0 });
    });
  }
});
