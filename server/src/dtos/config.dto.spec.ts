import z from 'zod';
import {
  AdminConfigDto,
  PublicConfigDto,
  UserConfigDto,
  defaults,
  mapPublicConfig,
  mapUserConfig,
} from 'src/dtos/config.dto.js';
import { getKeysDeep } from 'src/utils/misc.js';

const PUBLIC_PROPERTIES = [
  'oauth.autoLaunch',
  'oauth.buttonText',
  'oauth.enabled',
  'passkey.enabled',
  'passwordLogin.enabled',
  'server.loginPageMessage',
  'theme.customCss',
];

describe('config visibility', () => {
  it('should expose every property to admins', () => {
    const paths = getKeysDeep(defaults);

    expect(paths).toEqual(expect.arrayContaining(PUBLIC_PROPERTIES));
    expect(paths).toContain('oauth.clientSecret');
    expect(paths.length).toBeGreaterThan(100);
  });

  it('should expose the public properties to everyone', () => {
    expect(getKeysDeep(mapPublicConfig(defaults)).sort()).toEqual(PUBLIC_PROPERTIES);
  });

  it('should expose everything public to logged in users as well', () => {
    expect(getKeysDeep(mapUserConfig(defaults))).toEqual(expect.arrayContaining(PUBLIC_PROPERTIES));
  });

  it('should accept the defaults with the admin schema', () => {
    expect(AdminConfigDto.schema.safeParse(defaults)).toEqual(expect.objectContaining({ success: true }));
  });

  it('should map the defaults onto the user and public schemas', () => {
    expect(UserConfigDto.schema.safeParse(mapUserConfig(defaults))).toEqual(expect.objectContaining({ success: true }));
    expect(PublicConfigDto.schema.safeParse(mapPublicConfig(defaults))).toEqual(
      expect.objectContaining({ success: true }),
    );
  });

  it('should not leak admin properties into the public config', () => {
    const config = mapPublicConfig(defaults) as Record<string, any>;

    expect(config.oauth).toEqual({
      autoLaunch: defaults.oauth.autoLaunch,
      buttonText: defaults.oauth.buttonText,
      enabled: defaults.oauth.enabled,
    });
    expect(config.job).toBeUndefined();
    expect(config.image).toBeUndefined();
    expect(config.notifications).toBeUndefined();
  });

  it('should keep the visibility metadata out of the schemas', () => {
    for (const schema of [AdminConfigDto.schema, UserConfigDto.schema, PublicConfigDto.schema]) {
      const json = JSON.stringify(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }));
      expect(json).not.toContain('visibility');
    }
  });
});

const parsePasskey = (passkey: Record<string, unknown>) => AdminConfigDto.schema.safeParse({ ...defaults, passkey });
const passkeyMessages = (passkey: Record<string, unknown>) =>
  parsePasskey(passkey).error?.issues.map((issue) => issue.message);

describe('passkey config', () => {
  it('should allow enabling without a domain', () => {
    expect(parsePasskey({ enabled: true, domain: null, additionalDomains: [] }).success).toBe(true);
  });

  it('should prepend https and accept a trailing slash', () => {
    const result = parsePasskey({
      enabled: true,
      domain: 'immich.example',
      additionalDomains: ['https://immich.tailnet.example:2283', 'photos.immich.example/'],
    });

    expect(result.success).toBe(true);
    expect(result.data?.passkey).toEqual({
      enabled: true,
      domain: 'https://immich.example',
      additionalDomains: ['https://immich.tailnet.example:2283', 'https://photos.immich.example/'],
    });
  });

  it('should reject domains that are not https', () => {
    expect(passkeyMessages({ enabled: true, domain: 'ftp://immich.example', additionalDomains: [] })).toEqual([
      'Passkey domain must be a valid https URL',
    ]);
  });

  it('should reject domains with a path', () => {
    expect(
      passkeyMessages({ enabled: true, domain: null, additionalDomains: ['immich.tailnet.example/photos'] }),
    ).toEqual(['Additional domain must not include a path, query, or fragment']);
  });

  it('should reject duplicate additional domains', () => {
    expect(
      passkeyMessages({
        enabled: true,
        domain: null,
        additionalDomains: ['immich.tailnet.example', 'https://immich.tailnet.example/'],
      }),
    ).toEqual(['Duplicate domain https://immich.tailnet.example']);
  });

  it('should reject the passkey domain as an additional domain', () => {
    expect(
      passkeyMessages({ enabled: true, domain: 'immich.example', additionalDomains: ['https://immich.example/'] }),
    ).toEqual(['The passkey domain is always allowed and must not be listed as an additional domain']);
  });
});
