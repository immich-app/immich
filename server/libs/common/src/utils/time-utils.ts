import { exiftool } from 'exiftool-vendored';

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
      const exifData = await exiftool.read(originalPath);

      if (exifData && exifData['DateTimeOriginal']) {
        await exiftool.end();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return exifData['DateTimeOriginal'].toString()!;
      } else {
        return new Date().toISOString();
      }
    } catch (error) {
      return new Date().toISOString();
    }
  };

  // @ts-ignore
  const getTimestampFromFilename = async (originalPath: string): Promise<string> => {
    const match = originalPath.match(/(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
    }
  };

  return { checkValidTimestamp, getTimestampFromExif, getTimestampFromFilename };
}

export const timeUtils = createTimeUtils();
