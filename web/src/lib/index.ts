import { DateTime } from 'luxon';
import { twMerge } from 'tailwind-merge';

export const cleanClass = (...classNames: unknown[]) => {
  return twMerge(
    flattenClass(classNames)
      .filter((className) => {
        if (!className || typeof className === 'boolean') {
          return false;
        }

        return typeof className === 'string';
      })
      .join(' '),
  );
};

const flattenClass = (classNames: unknown[]): unknown[] =>
  classNames.flatMap((className) => (Array.isArray(className) ? flattenClass(className) : [className]));

export const isDefined = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined;

export const getHeatmapRange = () => {
  const to = DateTime.utc().startOf('day');
  const from = to.minus({ weeks: 51 }).plus({ days: 1 });
  const fromSunday = from.minus({ days: from.weekday % 7 });
  return { $from: fromSunday.toISODate()!, to: to.toISODate()! };
};
