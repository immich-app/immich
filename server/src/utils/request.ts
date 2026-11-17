import { IncomingHttpHeaders } from 'node:http';
import { UAParser } from 'ua-parser-js';

export const fromChecksum = (checksum: string): Buffer => {
  return Buffer.from(checksum, checksum.length === 28 ? 'base64' : 'hex');
};

export const fromMaybeArray = <T>(param: T | T[]) => (Array.isArray(param) ? param[0] : param);

export const getAppVersionFromUA = (ua: string) =>
  ua.match(/^immich-(?:android|ios|unknown)\/(?<appVersion>.+)$/)?.groups?.appVersion ??
  // legacy format
  ua.match(/^Immich_(?:Android|iOS|Unknown)_(?<appVersion>.+)$/)?.groups?.appVersion ??
  null;

export const getUserAgentDetails = (headers: IncomingHttpHeaders) => {
  const userAgent = UAParser(headers['user-agent']);
  const appVersion = getAppVersionFromUA(headers['user-agent'] ?? '');

  return {
    deviceType: userAgent.browser.name || userAgent.device.type || (headers['devicemodel'] as string) || '',
    deviceOS: userAgent.os.name || (headers['devicetype'] as string) || '',
    appVersion,
  };
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const isCrossOriginRequest = (headers: IncomingHttpHeaders, method?: string): boolean => {
  const isWebsocket = headers.upgrade?.toLowerCase() === 'websocket';
  if (method && SAFE_METHODS.has(method) && !isWebsocket) {
    return false;
  }

  const site = headers['sec-fetch-site'];
  if (site) {
    return site !== 'same-origin' && site !== 'none';
  }

  const { origin, host } = headers;
  if (!origin) {
    return false;
  }

  return !URL.canParse(origin) || new URL(origin).host !== host;
};
