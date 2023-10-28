export const timeSince = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (
    date.getDate() === now.getDate() - 1 &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  ) {
    return 'Yesterday';
  }
  let interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  return 'Just now';
};

export const isTenMinutesApart = (date1: string | null, date2: string | null): boolean => {
  if (!date1 || !date2) {
    return false;
  }
  const diffInMilliseconds = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  const minutesDifference = diffInMilliseconds / (1000 * 60);

  return minutesDifference >= 10;
};
