import compareAsc from "../compareAsc/index.js";
import differenceInYears from "../differenceInYears/index.js";
import differenceInMonths from "../differenceInMonths/index.js";
import differenceInDays from "../differenceInDays/index.js";
import differenceInHours from "../differenceInHours/index.js";
import differenceInMinutes from "../differenceInMinutes/index.js";
import differenceInSeconds from "../differenceInSeconds/index.js";
import isValid from "../isValid/index.js";
import requiredArgs from "../_lib/requiredArgs/index.js";
import toDate from "../toDate/index.js";
import sub from "../sub/index.js";
/**
 * @name intervalToDuration
 * @category Common Helpers
 * @summary Convert interval to duration
 *
 * @description
 * Convert a interval object to a duration object.
 *
 * @param {Interval} interval - the interval to convert to duration
 *
 * @returns {Duration} The duration Object
 * @throws {TypeError} Requires 2 arguments
 * @throws {RangeError} `start` must not be Invalid Date
 * @throws {RangeError} `end` must not be Invalid Date
 *
 * @example
 * // Get the duration between January 15, 1929 and April 4, 1968.
 * intervalToDuration({
 *   start: new Date(1929, 0, 15, 12, 0, 0),
 *   end: new Date(1968, 3, 4, 19, 5, 0)
 * })
 * // => { years: 39, months: 2, days: 20, hours: 7, minutes: 5, seconds: 0 }
 */

export default function intervalToDuration(_ref) {
  var start = _ref.start,
      end = _ref.end;
  requiredArgs(1, arguments);
  var dateLeft = toDate(start);
  var dateRight = toDate(end);

  if (!isValid(dateLeft)) {
    throw new RangeError('Start Date is invalid');
  }

  if (!isValid(dateRight)) {
    throw new RangeError('End Date is invalid');
  }

  var duration = {
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };
  var sign = compareAsc(dateLeft, dateRight);
  duration.years = Math.abs(differenceInYears(dateLeft, dateRight));
  var remainingMonths = sub(dateLeft, {
    years: sign * duration.years
  });
  duration.months = Math.abs(differenceInMonths(remainingMonths, dateRight));
  var remainingDays = sub(remainingMonths, {
    months: sign * duration.months
  });
  duration.days = Math.abs(differenceInDays(remainingDays, dateRight));
  var remainingHours = sub(remainingDays, {
    days: sign * duration.days
  });
  duration.hours = Math.abs(differenceInHours(remainingHours, dateRight));
  var remainingMinutes = sub(remainingHours, {
    hours: sign * duration.hours
  });
  duration.minutes = Math.abs(differenceInMinutes(remainingMinutes, dateRight));
  var remainingSeconds = sub(remainingMinutes, {
    minutes: sign * duration.minutes
  });
  duration.seconds = Math.abs(differenceInSeconds(remainingSeconds, dateRight));
  return duration;
}