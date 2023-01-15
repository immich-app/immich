// create unit test for time utils

import { timeUtils } from './time-utils';

describe('Time Utilities', () => {
  describe('getTimestampFromFilename', () => {
    it('should return a timestamp in ISO format, test 1', async () => {
      const filePath = 'IMG_20160311_220930.jpg';
      const timestamp = await timeUtils.getTimestampFromFilename(filePath);
      expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    it('should return the timestamp in ISO format, test 2', async () => {
      const filePath = '20150311_244456.jpg';
      const timestamp = await timeUtils.getTimestampFromFilename(filePath);
      expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });
  });

  describe('checkValidTimestamp', () => {
    it('check for year 0000', () => {
      const result = timeUtils.checkValidTimestamp('0000-00-00T00:00:00.000Z');
      expect(result).toBeFalsy();
    });

    it('check for 6-digits year with plus sign', () => {
      const result = timeUtils.checkValidTimestamp('+12345-00-00T00:00:00.000Z');
      expect(result).toBeFalsy();
    });

    it('check for 6-digits year with negative sign', () => {
      const result = timeUtils.checkValidTimestamp('-12345-00-00T00:00:00.000Z');
      expect(result).toBeFalsy();
    });

    it('check for current date', () => {
      const result = timeUtils.checkValidTimestamp(new Date().toISOString());
      expect(result).toBeTruthy();
    });

    it('check for year before 1583', () => {
      const result = timeUtils.checkValidTimestamp('1582-12-31T23:59:59.999Z');
      expect(result).toBeFalsy();
    });

    it('check for year after 9999', () => {
      const result = timeUtils.checkValidTimestamp('10000-00-00T00:00:00.000Z');
      expect(result).toBeFalsy();
    });
  });
});
