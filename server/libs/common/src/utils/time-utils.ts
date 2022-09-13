import exifr from 'exifr';

function createTimeUtils() {
  const checkValidTimestamp = (timestamp: string): boolean => {
    const parsedTimestamp = Date.parse(timestamp);

    if (isNaN(parsedTimestamp)) {
      return false;
    }

    const date = new Date(parsedTimestamp);

    if (date.getFullYear() < 1583 || date.getFullYear() > 9999) {
      return false;
    }

    return date.getFullYear() > 0;
  };

  const getTimestampFromExif = async (originalPath: string): Promise<string> => {
    try {
      const exifData = await exifr.parse(originalPath, {
        tiff: true,
        ifd0: true as any,
        ifd1: true,
        exif: true,
        gps: true,
        interop: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true,
      });

      if (exifData && exifData['DateTimeOriginal']) {
        return exifData['DateTimeOriginal'];
      } else {
        return new Date().toISOString();
      }
    } catch (error) {
      return new Date().toISOString();
    }
  };
  return { checkValidTimestamp, getTimestampFromExif };
}

export const timeUtils = createTimeUtils();
