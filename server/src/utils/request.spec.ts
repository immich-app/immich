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
  it('should return null device details without headers', () => {
    expect(getUserAgentDetails({})).toEqual({ deviceType: null, deviceOS: null, appVersion: null });
  });

  it('should fall back to the mobile device headers', () => {
    expect(getUserAgentDetails({ devicemodel: 'Pixel 8', devicetype: 'Android' })).toEqual({
      deviceType: 'Pixel 8',
      deviceOS: 'Android',
      appVersion: null,
    });
  });
});
