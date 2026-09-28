import { getAppVersionFromUA, getUserAgentDetails } from 'src/utils/request.js';

describe(getAppVersionFromUA.name, () => {
  it('should get the app version for android', () => {
    expect(getAppVersionFromUA('immich-android/1.123.4')).toEqual('1.123.4');
  });

  it('should get the app version for ios', () => {
    expect(getAppVersionFromUA('immich-ios/1.123.4')).toEqual('1.123.4');
  });

  it('should get the app version for unknown', () => {
    expect(getAppVersionFromUA('immich-unknown/1.123.4')).toEqual('1.123.4');
  });

  describe('legacy format', () => {
    it('should get the app version from the old android format', () => {
      expect(getAppVersionFromUA('Immich_Android_1.123.4')).toEqual('1.123.4');
    });

    it('should get the app version from the old ios format', () => {
      expect(getAppVersionFromUA('Immich_iOS_1.123.4')).toEqual('1.123.4');
    });

    it('should get the app version from the old unknown format', () => {
      expect(getAppVersionFromUA('Immich_Unknown_1.123.4')).toEqual('1.123.4');
    });
  });
});

describe(getUserAgentDetails.name, () => {
  it('should return null deviceType when no headers are present', () => {
    expect(getUserAgentDetails({}).deviceType).toBeNull();
  });

  it('should return null deviceType for an empty user-agent string', () => {
    expect(getUserAgentDetails({ 'user-agent': '' }).deviceType).toBeNull();
  });

  it('should return the parsed deviceType for a real browser user-agent', () => {
    const details = getUserAgentDetails({
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    expect(details.deviceType).toEqual('Chrome');
  });

  it('should fall back to the devicemodel header for deviceType', () => {
    const details = getUserAgentDetails({ devicemodel: 'Pixel 8' });
    expect(details.deviceType).toEqual('Pixel 8');
  });
});
