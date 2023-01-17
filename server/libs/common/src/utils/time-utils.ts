// This is needed as resolving for the vendored
// exiftool fails in tests otherwise but as it's not meant to be a requirement
// of a project directly I had to include the line below the comment.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { exiftool } from 'exiftool-vendored.pl';

function createTimeUtils() {
  const floatRegex = /[+-]?([0-9]*[.])?[0-9]+/;
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

  const parseStringToNumber = async (original: string | undefined): Promise<number | null> => {
    const match = original?.match(floatRegex)?.[0];
    if (match) {
      return parseFloat(match);
    } else {
      return null;
    }
  };

  return { checkValidTimestamp, getTimestampFromExif, parseStringToNumber };
}

export const timeUtils = createTimeUtils();
