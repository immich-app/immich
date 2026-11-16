import helmet, { type HelmetOptions } from 'helmet';
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import helmetOptions from '../../../../server/helmet.json' with { type: 'json' };
import { applyCspHashes } from '../../../../server/src/utils/helmet.ts';

const cspManifestFile = path.resolve(import.meta.dirname, '../../../build/.csp.json');

const loadOptions = (): HelmetOptions => {
  const { contentSecurityPolicy } = helmetOptions;
  const manifest = JSON.parse(readFileSync(cspManifestFile, 'utf8')) as Record<string, string[]>;
  const directives = applyCspHashes(contentSecurityPolicy.directives, manifest);

  return { ...helmetOptions, contentSecurityPolicy: { ...contentSecurityPolicy, directives } };
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
