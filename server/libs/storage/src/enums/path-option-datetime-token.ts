/**
 * Selected Luxon's Token
 * https://moment.github.io/luxon/#/formatting?id=table-of-tokens
 */
export enum PathOptionDatetimeToken {
  /**
   * Year unpaded (4-digit)
   * e.g. 2019
   */
  YEAR_FULL = 'y',

  /**
   * Year 2-digit
   * e.g. 19
   */
  YEAR_TWO_DIGITS = 'yy',

  /**
   * month as an unpadded number
   * e.g. '1'
   */
  MONTH_UNPADDED = 'L',

  /**
   * month as a padded number
   * e.g. '01'
   */
  MONTH_PADDED = 'LL',

  /**
   * month as an abbreviated localized string
   * e.g. 'Jan'
   */
  MONTH_LOCALIZED = 'LLL',

  /**
   * month as an unabbreviated localized string
   * e.g. 'January'
   */
  MONTH_FULL = 'LLLL',

  /**
   * day of the month, no padding
   * e.g. '18'
   * e.g. '9'
   */
  DAY_UNPADDED = 'd',

  /**
   * day of the month, padded to 2
   * e.g. '18'
   * e.g. '09'
   */
  DAY_PADDED = 'dd',
}
