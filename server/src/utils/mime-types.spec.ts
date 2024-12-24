import { mimeTypes } from 'src/utils/mime-types';

describe('mimeTypes', () => {
  for (const { mimetype, extension } of [
    // Please ensure this list is sorted.
    { mimetype: 'image/3fr', extension: '.3fr' },
    { mimetype: 'image/ari', extension: '.ari' },
    { mimetype: 'image/arw', extension: '.arw' },
    { mimetype: 'image/avif', extension: '.avif' },
    { mimetype: 'image/bmp', extension: '.bmp' },
    { mimetype: 'image/cap', extension: '.cap' },
    { mimetype: 'image/cin', extension: '.cin' },
    { mimetype: 'image/cr2', extension: '.cr2' },
    { mimetype: 'image/cr3', extension: '.cr3' },
    { mimetype: 'image/crw', extension: '.crw' },
    { mimetype: 'image/dcr', extension: '.dcr' },
    { mimetype: 'image/dng', extension: '.dng' },
    { mimetype: 'image/erf', extension: '.erf' },
    { mimetype: 'image/fff', extension: '.fff' },
    { mimetype: 'image/gif', extension: '.gif' },
    { mimetype: 'image/heic', extension: '.heic' },
    { mimetype: 'image/heif', extension: '.heif' },
    { mimetype: 'image/hif', extension: '.hif' },
    { mimetype: 'image/iiq', extension: '.iiq' },
    { mimetype: 'image/jpeg', extension: '.jpe' },
    { mimetype: 'image/jpeg', extension: '.jpeg' },
    { mimetype: 'image/jpeg', extension: '.jpg' },
    { mimetype: 'image/jxl', extension: '.jxl' },
    { mimetype: 'image/k25', extension: '.k25' },
    { mimetype: 'image/kdc', extension: '.kdc' },
    { mimetype: 'image/mrw', extension: '.mrw' },
    { mimetype: 'image/nef', extension: '.nef' },
    { mimetype: 'image/nrw', extension: '.nrw' },
    { mimetype: 'image/orf', extension: '.orf' },
    { mimetype: 'image/ori', extension: '.ori' },
    { mimetype: 'image/pef', extension: '.pef' },
    { mimetype: 'image/png', extension: '.png' },
    { mimetype: 'image/psd', extension: '.psd' },
    { mimetype: 'image/raf', extension: '.raf' },
    { mimetype: 'image/raw', extension: '.raw' },
    { mimetype: 'image/rwl', extension: '.rwl' },
    { mimetype: 'image/sr2', extension: '.sr2' },
    { mimetype: 'image/srf', extension: '.srf' },
    { mimetype: 'image/srw', extension: '.srw' },
    { mimetype: 'image/svg', extension: '.svg' },
    { mimetype: 'image/tiff', extension: '.tif' },
    { mimetype: 'image/tiff', extension: '.tiff' },
    { mimetype: 'image/webp', extension: '.webp' },
    { mimetype: 'image/vnd.adobe.photoshop', extension: '.psd' },
    { mimetype: 'image/x-adobe-dng', extension: '.dng' },
    { mimetype: 'image/x-arriflex-ari', extension: '.ari' },
    { mimetype: 'image/x-canon-cr2', extension: '.cr2' },
    { mimetype: 'image/x-canon-cr3', extension: '.cr3' },
    { mimetype: 'image/x-canon-crw', extension: '.crw' },
    { mimetype: 'image/x-epson-erf', extension: '.erf' },
    { mimetype: 'image/x-fuji-raf', extension: '.raf' },
    { mimetype: 'image/x-hasselblad-3fr', extension: '.3fr' },
    { mimetype: 'image/x-hasselblad-fff', extension: '.fff' },
    { mimetype: 'image/x-kodak-dcr', extension: '.dcr' },
    { mimetype: 'image/x-kodak-k25', extension: '.k25' },
    { mimetype: 'image/x-kodak-kdc', extension: '.kdc' },
    { mimetype: 'image/x-leica-rwl', extension: '.rwl' },
    { mimetype: 'image/x-minolta-mrw', extension: '.mrw' },
    { mimetype: 'image/x-nikon-nef', extension: '.nef' },
    { mimetype: 'image/x-olympus-orf', extension: '.orf' },
    { mimetype: 'image/x-olympus-ori', extension: '.ori' },
    { mimetype: 'image/x-panasonic-raw', extension: '.raw' },
    { mimetype: 'image/x-pentax-pef', extension: '.pef' },
    { mimetype: 'image/x-phantom-cin', extension: '.cin' },
    { mimetype: 'image/x-phaseone-cap', extension: '.cap' },
    { mimetype: 'image/x-phaseone-iiq', extension: '.iiq' },
    { mimetype: 'image/x-samsung-srw', extension: '.srw' },
    { mimetype: 'image/x-sigma-x3f', extension: '.x3f' },
    { mimetype: 'image/x-sony-arw', extension: '.arw' },
    { mimetype: 'image/x-sony-sr2', extension: '.sr2' },
    { mimetype: 'image/x-sony-srf', extension: '.srf' },
    { mimetype: 'image/x3f', extension: '.x3f' },
    { mimetype: 'video/3gpp', extension: '.3gp' },
    { mimetype: 'video/3gpp', extension: '.3gpp' },
    { mimetype: 'video/avi', extension: '.avi' },
    { mimetype: 'video/mp2t', extension: '.m2ts' },
    { mimetype: 'video/mp2t', extension: '.mts' },
    { mimetype: 'video/mp4', extension: '.mp4' },
    { mimetype: 'video/mpeg', extension: '.mpe' },
    { mimetype: 'video/mpeg', extension: '.mpeg' },
    { mimetype: 'video/mpeg', extension: '.mpg' },
    { mimetype: 'video/msvideo', extension: '.avi' },
    { mimetype: 'video/quicktime', extension: '.mov' },
    { mimetype: 'video/vnd.avi', extension: '.avi' },
    { mimetype: 'video/webm', extension: '.webm' },
    { mimetype: 'video/x-flv', extension: '.flv' },
    { mimetype: 'video/x-matroska', extension: '.mkv' },
    { mimetype: 'video/x-ms-wmv', extension: '.wmv' },
    { mimetype: 'video/x-msvideo', extension: '.avi' },
    { mimetype: 'video/mpeg', extension: '.vob' },
  ]) {
    it(`should map ${extension} to ${mimetype}`, () => {
      expect({ ...mimeTypes.image, ...mimeTypes.video }[extension]).toContain(mimetype);
    });
  }

  describe('profile', () => {
    it('should contain only lowercase mime types', () => {
      const keys = Object.keys(mimeTypes.profile);
      expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));

      const values = Object.values(mimeTypes.profile).flat();
      expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
    });

    for (const [extension, v] of Object.entries(mimeTypes.profile)) {
      it(`should lookup ${extension}`, () => {
        expect(mimeTypes.lookup(`test.${extension}`)).toEqual(v[0]);
      });
    }
  });

  describe('image', () => {
    it('should contain only lowercase mime types', () => {
      const keys = Object.keys(mimeTypes.image);
      expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));

      const values = Object.values(mimeTypes.image).flat();
      expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
    });

    it('should contain only image mime types', () => {
      const values = Object.values(mimeTypes.image).flat();
      expect(values).toEqual(values.filter((mimeType) => mimeType.startsWith('image/')));
    });

    for (const [extension, v] of Object.entries(mimeTypes.image)) {
      it(`should lookup ${extension}`, () => {
        expect(mimeTypes.lookup(`test.${extension}`)).toEqual(v[0]);
      });
    }
  });

  describe('video', () => {
    it('should contain only lowercase mime types', () => {
      const keys = Object.keys(mimeTypes.video);
      expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));

      const values = Object.values(mimeTypes.video).flat();
      expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
    });

    it('should be a sorted list', () => {
      const keys = Object.keys(mimeTypes.video);
      expect(keys).toEqual(keys.toSorted());
    });

    it('should contain only video mime types', () => {
      const values = Object.values(mimeTypes.video).flat();
      expect(values).toEqual(values.filter((mimeType) => mimeType.startsWith('video/')));
    });

    for (const [extension, v] of Object.entries(mimeTypes.video)) {
      it(`should lookup ${extension}`, () => {
        expect(mimeTypes.lookup(`test.${extension}`)).toEqual(v[0]);
      });
    }
  });

  describe('sidecar', () => {
    it('should contain only lowercase mime types', () => {
      const keys = Object.keys(mimeTypes.sidecar);
      expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));

      const values = Object.values(mimeTypes.sidecar).flat();
      expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
    });

    it('should be a sorted list', () => {
      const keys = Object.keys(mimeTypes.sidecar);
      expect(keys).toEqual(keys.toSorted());
    });

    it('should contain only xml mime types', () => {
      expect(Object.values(mimeTypes.sidecar).flat()).toEqual(['application/xml', 'text/xml']);
    });

    for (const [extension, v] of Object.entries(mimeTypes.sidecar)) {
      it(`should lookup ${extension}`, () => {
        expect(mimeTypes.lookup(`it.${extension}`)).toEqual(v[0]);
      });
    }
  });

  describe('raw', () => {
    it('should contain only lowercase mime types', () => {
      const keys = Object.keys(mimeTypes.raw);
      expect(keys).toEqual(keys.map((mimeType) => mimeType.toLowerCase()));

      const values = Object.values(mimeTypes.raw).flat();
      expect(values).toEqual(values.map((mimeType) => mimeType.toLowerCase()));
    });

    for (const [extension, v] of Object.entries(mimeTypes.video)) {
      it(`should lookup ${extension}`, () => {
        expect(mimeTypes.lookup(`test.${extension}`)).toEqual(v[0]);
      });
    }
  });
});
