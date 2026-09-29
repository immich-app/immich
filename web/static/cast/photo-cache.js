/** Keep decoded photos on the receiver so revisiting them does not hit the network. */
export class PhotoCache {
  constructor(limit = 3, createImage = () => new Image()) {
    this.limit = limit;
    this.createImage = createImage;
    this.entries = new Map();
  }

  /** @param {string} url @param {string | undefined} [fallbackUrl] */
  load(url, fallbackUrl) {
    const cached = this.entries.get(url);
    if (cached) {
      this.entries.delete(url);
      this.entries.set(url, cached);
      return cached;
    }

    const promise = this.loadImage(url).catch((error) => {
      if (!fallbackUrl) {
        throw error;
      }
      return this.loadImage(fallbackUrl);
    });
    this.entries.set(url, promise);
    while (this.entries.size > this.limit) {
      this.entries.delete(this.entries.keys().next().value);
    }
    void promise.catch(() => {
      if (this.entries.get(url) === promise) {
        this.entries.delete(url);
      }
    });
    return promise;
  }

  /** @param {string} url */
  async loadImage(url) {
    const image = this.createImage();
    image.decoding = 'async';
    if (typeof image.decode === 'function') {
      image.src = url;
      await image.decode();
    } else {
      await new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', reject, { once: true });
        image.src = url;
      });
    }
    return image;
  }
}
