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

  const parseStringToNumber = (original: string | undefined) => {
    const match = original?.match(floatRegex)?.[0];
    if (match) {
      return parseFloat(match);
    } else {
      return null;
    }
  };

  return { checkValidTimestamp, parseStringToNumber };
}

export const timeUtils = createTimeUtils();
