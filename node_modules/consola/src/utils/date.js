import dayjs from 'dayjs'

export function formatDate (timeFormat, date) {
  return dayjs(date).format(timeFormat)
}
