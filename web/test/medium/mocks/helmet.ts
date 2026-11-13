import helmet, { type HelmetOptions } from 'helmet';
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { applyCspHashes } from '../../../../server/src/utils/helmet.ts';

const webRoot = path.resolve(import.meta.dirname, '../../..');
const helmetFile = path.join(webRoot, '../server/helmet.json');
const cspManifestFile = path.join(webRoot, 'build/.csp.json');

const readJson = <T>(file: string) => JSON.parse(readFileSync(file, 'utf8')) as T;

const loadOptions = (): HelmetOptions => {
  const options = readJson<HelmetOptions>(helmetFile);
  const contentSecurityPolicy = options.contentSecurityPolicy;
  if (!contentSecurityPolicy || contentSecurityPolicy === true || !contentSecurityPolicy.directives) {
    return options;
  }

  const directives = applyCspHashes(contentSecurityPolicy.directives, readJson(cspManifestFile));

  return { ...options, contentSecurityPolicy: { ...contentSecurityPolicy, directives } };
};

let headers: Record<string, string> | undefined;

export const getHelmetHeaders = () => {
  if (!headers) {
    const collected: Record<string, string> = {};
    const response = {
      setHeader: (name: string, value: string) => {
        collected[name.toLowerCase()] = value;
      },
      removeHeader: (name: string) => {
        delete collected[name.toLowerCase()];
      },
    };
    helmet(loadOptions())({} as IncomingMessage, response as unknown as ServerResponse, () => {});
    headers = collected;
  }

  return headers;
};
