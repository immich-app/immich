import type { HelmetOptions } from 'helmet';

type CspOptions = Exclude<NonNullable<HelmetOptions['contentSecurityPolicy']>, boolean>;
export type CspDirectives = NonNullable<CspOptions['directives']>;

export const restrictiveCspDirectives: CspDirectives = {
  'default-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'none'"],
  'frame-ancestors': ["'none'"],
  sandbox: [],
};

export const applyCspHashes = (directives: CspDirectives, manifest: Record<string, string[]>): CspDirectives => {
  const merged = { ...directives };
  for (const [directive, hashes] of Object.entries(manifest)) {
    const sources = merged[directive];
    if (Array.isArray(sources) && !sources.includes(`'unsafe-inline'`)) {
      merged[directive] = [...sources, ...hashes];
    }
  }

  return merged;
};
