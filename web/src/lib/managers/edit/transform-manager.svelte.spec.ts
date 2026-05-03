import source from './transform-manager.svelte.ts?raw';

describe('transformManager', () => {
  it('sets anonymous CORS before loading the preview image', () => {
    const crossOriginIndex = source.indexOf("this.imgElement.crossOrigin = 'anonymous';");
    const srcIndex = source.indexOf('this.imgElement.src = imageURL;');

    expect(crossOriginIndex).toBeGreaterThanOrEqual(0);
    expect(crossOriginIndex).toBeLessThan(srcIndex);
  });
});
