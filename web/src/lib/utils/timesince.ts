export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const isTenMinutesApart = (date1: string, date2: string): boolean => {
  if (!date1 || !date2) {
    return false;
  }
  const diffInMilliseconds = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  const minutesDifference = diffInMilliseconds / (1000 * 60);

  return minutesDifference >= 10;
};
