import { BadRequestException } from '@nestjs/common';
import { IncomingHttpHeaders } from 'node:http';
import { UAParser } from 'ua-parser-js';
import z from 'zod';

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

export function validateSyncOrReject<T>(cls: { schema: z.ZodType<T> }, obj: unknown): T {
  const result = cls.schema.safeParse(obj);
  if (result.success) {
    return result.data;
  }
  throw new BadRequestException(result.error.issues.map(({ message }) => message));
}
