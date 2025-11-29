import { IncomingHttpHeaders } from 'node:http';
import { UAParser } from 'ua-parser-js';

export const fromChecksum = (checksum: string): Buffer => {
  return Buffer.from(checksum, checksum.length === 28 ? 'base64' : 'hex');
};

export const fromMaybeArray = <T>(param: T | T[]) => (Array.isArray(param) ? param[0] : param);

const getAppVersionFromUA = (ua: string) =>
  ua.match(/^Immich_(?:Android|iOS)_(?<appVersion>.+)$/)?.groups?.appVersion ?? null;

export const getUserAgentDetails = (headers: IncomingHttpHeaders) => {
  const userAgent = UAParser(headers['user-agent']);
  const appVersion = getAppVersionFromUA(headers['user-agent'] ?? '');

  return {
    deviceType: userAgent.browser.name || userAgent.device.type || (headers['devicemodel'] as string) || '',
    deviceOS: userAgent.os.name || (headers['devicetype'] as string) || '',
    appVersion,
  };
};
