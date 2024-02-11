import { timeToSeconds } from './time-to-seconds';

describe('converting time to seconds', () => {
  it('parses hh:mm:ss correctly', () => {
    expect(timeToSeconds('01:02:03')).toBeCloseTo(3723);
  });

  it('parses hh:mm:ss.SSS correctly', () => {
    expect(timeToSeconds('01:02:03.456')).toBeCloseTo(3723.456);
  });

  it('parses h:m:s.S correctly', () => {
    expect(timeToSeconds('1:2:3.4')).toBeCloseTo(3723.4);
  });

  it('parses hhh:mm:ss.SSS correctly', () => {
    expect(timeToSeconds('100:02:03.456')).toBeCloseTo(360_123.456);
  });

  it('ignores ignores double milliseconds hh:mm:ss.SSS.SSSSSS', () => {
    expect(timeToSeconds('01:02:03.456.123456')).toBeCloseTo(3723.456);
  });
});
