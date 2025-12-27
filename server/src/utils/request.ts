import { IncomingHttpHeaders } from 'node:http';
import { UAParser } from 'ua-parser-js';

export const fromChecksum = (checksum: string): Buffer => {
  return Buffer.from(checksum, checksum.length === 28 ? 'base64' : 'hex');
};

export const fromMaybeArray = <T>(param: T | T[]) => (Array.isArray(param) ? param[0] : param);

const getAppVersionFromUA = (ua: string) =>
  ua.match(/^Immich_(?:Android|iOS)_(?<appVersion>.+)$/)?.groups?.appVersion ?? null;

const isImmichUserAgent = (ua: string) => {
  const immichPatterns = [
    /^Mobile$/,
    /^Dart\//,
    /^immich_mobile/,
    /^AppleCoreMedia/,
    /^Dalvik\//,
    /^Immich_(?:Android|iOS)_/,
  ];

  return immichPatterns.some((pattern) => pattern.test(ua));
};

export const getUserAgentDetails = (headers: IncomingHttpHeaders) => {
  const userAgent = UAParser(headers['user-agent']);
  const appVersion = getAppVersionFromUA(headers['user-agent'] ?? '');
  const isImmichApp = appVersion !== null || isImmichUserAgent(headers['user-agent'] ?? '');

  return {
    deviceType: isImmichApp
      ? 'Immich app'
      : userAgent.browser.name || userAgent.device.type || (headers['devicemodel'] as string) || '',
    deviceOS: userAgent.os.name || (headers['devicetype'] as string) || '',
    appVersion,
  };
};
