export const isTenMinutesApart = (date1: string, date2: string): boolean => {
  if (!date1 || !date2) {
    return false;
  }
  const diffInMilliseconds = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  const minutesDifference = diffInMilliseconds / (1000 * 60);

  return minutesDifference >= 10;
};
