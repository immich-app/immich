export default async (srcBlob: Blob, destBlob: Blob): Promise<Blob> => {
  const exif = await getApp1Segment(srcBlob);
  return new Blob([destBlob.slice(0, 2), exif, destBlob.slice(2)], {
    type: 'image/jpeg',
  });
};

const SOI = 0xffd8,
  SOS = 0xffda,
  APP1 = 0xffe1,
  EXIF = 0x45786966,
  LITTLE_ENDIAN = 0x4949,
  BIG_ENDIAN = 0x4d4d,
  TAG_ID_ORIENTATION = 0x0112,
  TAG_TYPE_SHORT = 3;

const getApp1Segment = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const buffer = (event.target as FileReader).result as ArrayBuffer;
      const view = new DataView(buffer);
      let offset = 0;
      if (view.getUint16(offset) !== SOI) {
        reject('not a valid JPEG');
        return;
      }
      offset += 2;

      let marker: number;
      do {
        marker = view.getUint16(offset);
        if (marker === SOS) {
          break;
        }

        const size = view.getUint16(offset + 2);
        if (marker === APP1 && view.getUint32(offset + 4) === EXIF) {
          const tiffOffset = offset + 10;
          let littleEndian: boolean;
          switch (view.getUint16(tiffOffset)) {
            case LITTLE_ENDIAN:
              littleEndian = true;
              break;
            case BIG_ENDIAN:
              littleEndian = false;
              break;
            default:
              reject('TIFF header contains invalid endian');
              return;
          }
          if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x2a) {
            reject('TIFF header contains invalid version');
            return;
          }

          const ifd0Offset = view.getUint32(tiffOffset + 4, littleEndian);
          const endOfTagsOffset =
            tiffOffset + ifd0Offset + 2 + view.getUint16(tiffOffset + ifd0Offset, littleEndian) * 12;
          for (let i = tiffOffset + ifd0Offset + 2; i < endOfTagsOffset; i += 12) {
            const tagId = view.getUint16(i, littleEndian);
            if (tagId === TAG_ID_ORIENTATION) {
              const tagType = view.getUint16(i + 2, littleEndian);
              if (tagType !== TAG_TYPE_SHORT) {
                reject('orientation tag is not a short');
                return;
              }
              if (view.getUint32(i + 4, littleEndian) !== 1) {
                reject('orientation tag has invalid count');
                return;
              }
              const tagValue = view.getUint16(i + 8, littleEndian);
              const newExif = new DataView(new ArrayBuffer(10));
              newExif.setUint16(0, EXIF, false);
              newExif.setUint16(2, view.getUint16(tiffOffset, littleEndian), false);
              newExif.setUint32(4, view.getUint32(tiffOffset + 4, littleEndian), false);
              newExif.setUint16(8, 1, false);
              newExif.setUint16(10, tagValue, littleEndian);
              resolve(newExif.buffer);
              return;
            }
          }
        }
      } while (marker !== SOS);
    });
    reader.readAsArrayBuffer(blob);
  });
